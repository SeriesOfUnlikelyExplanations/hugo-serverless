const assert = require('assert');
const expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const AWS = require('aws-sdk');
const blc = require("broken-link-checker");

const index = require('../index');

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
      createVpcEndpoint(params) {
        expect(params.ServiceName).to.equal(`com.amazonaws.${reqData.s3Upload.Records[0].awsRegion}.ssm`)
        expect(params.VpcId).to.equal('vpcID')
        expect(params.PrivateDnsEnabled).to.equal(true)
        expect(params.SecurityGroupIds).to.contain('securityGroupID')
        expect(params.SubnetIds).to.contain('subnetID')
        expect(params.VpcEndpointType).to.equal('Interface')
        return { promise: async () => {return resData.vpcEndpoint}}
      }
      describeVpcEndpoints() {
        return { promise: async () => {return resData.describeVpcEndpoints}}
      }
      deleteVpcEndpoints(params) {
        expect(params.VpcEndpointIds).to.have.members(['vpce-032a826a','vpce-aabbaabbaabbaabba']);
        return { promise: async () => {return { "Unsuccessful": [] }}}
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
  
    class cloudfrontMock {
      createInvalidation(params) {
        console.log(params);
        expect(params.DistributionId).to.equal('distID');
        expect(params.InvalidationBatch.Paths.Quantity).to.equal('1');
        expect(params.InvalidationBatch.Paths.Items).to.contain('/*');
        return { promise: async () => {return { 
          Location: '1234',
          Invalidation: {
            Id: 'IDFDVBD632BHDS5',
            Status: 'In Progress',
            CreateTime: new Date().toISOString(),
            InvalidationBatch: params.InvalidationBatch
          }
        }}}
      }
      getInvalidation(params) {
        console.log(params);
        expect(params.DistributionId).to.equal('distID');
        expect(params.Id).to.equal('IDFDVBD632BHDS5');
        return { promise: async () => {return { 
          Invalidation: {
            Id: 'IDFDVBD632BHDS5',
            Status: 'Completed',
            CreateTime: new Date().toISOString(),
            InvalidationBatch: {}
          }
        }}}
      }
    }
    cloudfrontStub = sinon.stub(AWS, 'CloudFront').returns(new cloudfrontMock());
          
    function SiteChecker(options, params) {
      expect(options.excludedKeywords).to.have.members(['gaiagps.com','amazon.com']);
      console.log(params);      
      return { 
        enqueue: (site) => { 
          if (site === 'https://siteName') {
            params.end()
          }
          return true 
        }
      }
    }
    siteCheckerStub = sinon.stub(blc, 'SiteChecker').callsFake(SiteChecker);
    
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
    it('Website Datasync Complete', async () => {
      const res = await index.handler(reqData.websiteDatasyncComplete, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.invalidate).to.be.true;
      expect(res.deletedvpcs.Unsuccessful).to.be.instanceof(Array);
      expect(res.deletedvpcs.Unsuccessful).to.have.length(0);
    });
    it('Theme Datasync Complete', async () => {
      const res = await index.handler(reqData.themeDatasyncComplete, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(404);
      expect(res.body).to.equal('Datalink task not supported');
    });
    
  });

});
