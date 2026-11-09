import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ok, badRequest, notFound, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return badRequest('Falta el ID del producto');
    }

    const body = JSON.parse(event.body || '{}');
    const { name, description, price, stock } = body;

    const existingProduct = await docClient.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId },
    }));

    if (!existingProduct.Item) {
      return notFound('Producto no encontrado');
    }

    const now = new Date().toISOString();
    const updatedProduct = {
      ...existingProduct.Item,
      name: name || existingProduct.Item.name,
      description: description || existingProduct.Item.description,
      price: price !== undefined ? price : existingProduct.Item.price,
      stock: stock !== undefined ? stock : existingProduct.Item.stock,
      updatedAt: now,
    };

    await docClient.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId },
      UpdateExpression: 'SET #name = :name, description = :description, price = :price, stock = :stock, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': updatedProduct.name,
        ':description': updatedProduct.description,
        ':price': updatedProduct.price,
        ':stock': updatedProduct.stock,
        ':updatedAt': now,
      },
    }));

    return ok(updatedProduct);
  } catch (error) {
    console.error('updateProduct error:', error);
    return internalServerError('Internal Server Error');
  }
};