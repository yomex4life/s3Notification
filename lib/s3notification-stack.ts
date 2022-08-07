import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Runtime, Code, Function } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class S3NotificationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'MyFirstBucket', {
      bucketName: '4life-cdk-cloudfront-s3',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const fileTable = new Table(this, 'file-table', {
      partitionKey: {name: 'id', type: AttributeType.STRING},
      tableName: 'product',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });

    
    const nodeJsProductFunctionProps: NodejsFunctionProps = {
      bundling: {
      externalModules: [
          'aws-sdk'
      ]
      },
      environment: {
          PRIMARY_KEY: 'id',
          DYNAMODB_TABLE_NAME: fileTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X
    } 

    const fileFunction = new NodejsFunction(this, 'file-lambda-function', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsProductFunctionProps
    });

    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(fileFunction), {suffix: '.png'});
    fileTable.grantReadWriteData(fileFunction);

  }
}
