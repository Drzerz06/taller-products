import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ok, notFound, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return notFound('El producto no fue encontrado');

    const result = await docClient.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId: id },
    }));

    if (!result.Item) {
      return notFound('El producto no fue encontrado');
    }

    return ok(result.Item);
  } catch (error) {
    console.error('getProduct error:', error);
    return internalServerError('Internal Server Error');
  }
};