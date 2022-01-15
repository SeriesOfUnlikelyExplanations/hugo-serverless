var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const AWS = require('aws-sdk');

var index = require('../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

function importTest(name, path) {
  describe(name, function () {
    require(path);
  });
}

// https://sinonjs.org/how-to/stub-dependency/
describe('Testing Admin lambda', function() {
  this.timeout(4000);
  before(() => {
    nock('https://ssm.us-west-2.amazonaws.com')
      .persist()
      .post('/')
      .reply(200, resData.ssm);

    nock.emitter.on("no match", (req) => {
      console.log(req)
      assert(false, 'application failure: no match')
    })
    class dataSyncMock {
      startTaskExecution(params) {
        ['datasyncSourceTask','datasyncWebsiteTask','datasyncThemeTask'].includes(params.TaskArn);
        return { promise: async () => {return { "TaskExecutionArn": `${params.TaskArn}/execution/exec-1234`}}}
      }
    }
    dataSyncStub = sinon.stub(AWS, 'DataSync').returns(new dataSyncMock());
    
    class EC2Mock {
      createVpcEndpoint( params) {
        expect(params.ServiceName).to.equal(`com.amazonaws.${reqData.s3Upload.Records[0].awsRegion}.ssm`)
        expect(params.VpcId).to.equal('vpcID')
        expect(params.PrivateDnsEnabled).to.equal(true)
        expect(params.SecurityGroupIds).to.contain('securityGroupID')
        expect(params.SubnetIds).to.contain('subnetID')
        expect(params.VpcEndpointType).to.equal('Interface')
        return { promise: async () => {return resData.vpcEndpoint}}
      }
    }
    EC2Stub = sinon.stub(AWS, 'EC2').returns(new EC2Mock());
    
    class S3Mock {
      ListObjectsV2(params) {
        expect(params.Bucket).to.equal('siteName');
        return { promise: async () => {return resData.listWebsiteBucket}}
      }
      deleteObjects(params) {
        expect(params.Bucket).to.equal('siteName');
        const checker = params.Delete.Objects.map(({Key}) => Key);
        expect(checker).to.have.members(['happyface.jpg','test.jpg']);
        return { promise: async () => {return {Deleted: params.Delete.Objects} }}
      }
    }
    S3Stub = sinon.stub(AWS, 'S3').returns(new S3Mock());
  
  });

  describe('Admin Tasks', () => {
    it('S3 upload', async () => {
      const res = await index.handler(reqData.s3Upload, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.sourceDatasync.TaskExecutionArn).to.equal('datasyncSourceTask/execution/exec-1234');
      expect(res.themeDatasync.TaskExecutionArn).to.equal('datasyncThemeTask/execution/exec-1234');
      expect(res.vpcEndpoint.VpcEndpoint.PolicyDocument).to.equal('{"Version":"2008-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":"*","Action":"*","Resource":"*"}]}');
      expect(res.vpcEndpoint.VpcEndpoint.VpcId).to.equal('vpc-1a2b3c4d');
      expect(res.vpcEndpoint.VpcEndpoint.State).to.equal('available');
      expect(res.vpcEndpoint.VpcEndpoint.ServiceName).to.equal('com.amazonaws.us-east-1.s3');
      expect(res.vpcEndpoint.VpcEndpoint.RouteTableIds).to.contain("rtb-11aa22bb");
      expect(res.vpcEndpoint.VpcEndpoint.VpcEndpointId).to.equal('vpc-1a2b3c4d');
      expect(res.vpcEndpoint.VpcEndpoint.CreationTimestamp).to.equal('2015-05-15T09:40:50Z');
    });
    it('Build Complete', async () => {
      const res = await index.handler(reqData.buildComplete, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.websiteDatasync.TaskExecutionArn).to.equal('datasyncWebsiteTask/execution/exec-1234');
      console.log(res);
    });
    it('Source Datasync Complete', async () => {
      const res = await index.handler(reqData.sourceDatasyncComplete, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      const checker = res.deleted.Deleted.map(({Key}) => Key);
      expect(checker).to.have.members(['happyface.jpg','test.jpg']);
    });
    
  });

});
