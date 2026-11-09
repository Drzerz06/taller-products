import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ok, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

export const listProductsBySeller = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sellerId = event.pathParameters?.sellerId;
    if (!sellerId) return ok([]);

    const result = await docClient.send(new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: 'seller-index',
      KeyConditionExpression: 'sellerId = :sellerId',
      ExpressionAttributeValues: {
        ':sellerId': sellerId,
      },
    }));

    return ok(result.Items || []);
  } catch (error) {
    console.error('listProductsBySeller error:', error);
    return internalServerError('Internal Server Error');
  }
};