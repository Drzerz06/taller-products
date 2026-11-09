import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { created, badRequest, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, description, price, stock, sellerId } = body;

    if (!name || !description || price === undefined || stock === undefined) {
      return badRequest('Faltan campos obligatorios: name, description, price, stock');
    }

    const claims = event.requestContext.authorizer?.claims || event.requestContext.authorizer;
    const finalSellerId = claims?.userId || sellerId || 'vendedor-123';

    const productId = uuidv4();
    const now = new Date().toISOString();

    const newProduct = {
      productId,
      sellerId: finalSellerId,
      name,
      description,
      price,
      stock,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: newProduct,
    }));

    return created(newProduct);
  } catch (error) {
    console.error('createProduct error:', error);
    return internalServerError('Internal Server Error');
  }
};