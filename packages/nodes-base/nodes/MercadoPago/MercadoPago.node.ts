import type {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { mercadoPagoApiRequest } from './GenericFunctions';

export class MercadoPago implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MercadoPago QR',
		name: 'mercadoPago',
		icon: 'file:mercadoPago.svg',
		group: ['transform'],
		version: 1,
		description: 'Genera códigos QR de pago con MercadoPago',
		defaults: {
			name: 'MercadoPago QR',
		},
		credentials: [
			{
				name: 'mercadoPagoApi',
				required: true,
			},
		],
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: 'Orden de compra',
				required: true,
				description: 'Título de la compra',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: 'Pago generado desde n8n',
				required: true,
				description: 'Descripción de la compra',
			},
			{
				displayName: 'External Reference',
				name: 'externalReference',
				type: 'string',
				default: `n8n-${Date.now()}`,
				description: 'ID de pedido personalizado que puedes sincronizar con tu sistema de venta',
			},
			{
				displayName: 'Items',
				name: 'items',
				type: 'fixedCollection',
				placeholder: 'Add Item',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				required: true,
				options: [
					{
						displayName: 'Item',
						name: 'item',
						values: [
							{
								displayName: 'Title',
								name: 'title',
								type: 'string',
								default: '',
								required: true,
								description: 'Título del producto',
							},
							{
								displayName: 'Unit Price',
								name: 'unitPrice',
								type: 'number',
								default: 0,
								required: true,
								description: 'Precio unitario del producto',
								typeOptions: {
									minValue: 0,
									numberStepSize: 0.01,
								},
							},
							{
								displayName: 'Description',
								name: 'description',
								type: 'string',
								default: '',
								description: 'Descripción del producto',
							},
							{
								displayName: 'Quantity',
								name: 'quantity',
								type: 'number',
								default: 1,
								required: true,
								description: 'Cantidad del producto',
								typeOptions: {
									minValue: 1,
									numberStepSize: 1,
								},
							},
							{
								displayName: 'Unit Measure',
								name: 'unitMeasure',
								type: 'options',
								default: 'unit',
								options: [
									{
										name: 'Unit',
										value: 'unit',
									},
									{
										name: 'Kilogram',
										value: 'kg',
									},
									{
										name: 'Gram',
										value: 'g',
									},
									{
										name: 'Liter',
										value: 'l',
									},
									{
										name: 'Meter',
										value: 'm',
									},
									{
										name: 'Square Meter',
										value: 'm²',
									},
									{
										name: 'Hour',
										value: 'hour',
									},
									{
										name: 'Day',
										value: 'day',
									},
								],
								description: 'Unidad de medida del producto',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		console.log('=== Iniciando ejecución del nodo MercadoPago ===');

		try {
			// Obtener credenciales
			const credentials = await this.getCredentials('mercadoPagoApi');
			console.log('Credenciales obtenidas:', {
				userId: credentials.userId,
				externalPosId: credentials.externalPosId,
				sandboxMode: credentials.sandboxMode,
			});

			// Obtener parámetros del nodo
			const title = this.getNodeParameter('title', 0) as string;
			const description = this.getNodeParameter('description', 0) as string;
			const externalReference =
				(this.getNodeParameter('externalReference', 0) as string) || `n8n-${Date.now()}`;
			const itemsData = this.getNodeParameter('items', 0) as {
				item?: Array<{
					title: string;
					unitPrice: number;
					description?: string;
					quantity: number;
					unitMeasure: string;
				}>;
			};

			// Validar que haya items
			if (!itemsData.item || itemsData.item.length === 0) {
				throw new Error('Debes agregar al menos un item');
			}

			// Procesar items y calcular totales
			const items: IDataObject[] = [];
			let totalAmount = 0;

			for (const item of itemsData.item) {
				const itemTotal = item.unitPrice * item.quantity;
				totalAmount += itemTotal;

				items.push({
					title: item.title,
					unit_price: item.unitPrice,
					description: item.description || '',
					quantity: item.quantity,
					unit_measure: item.unitMeasure || 'unit',
					total_amount: itemTotal,
				});
			}

			// Construir el body del request
			const requestBody: IDataObject = {
				external_reference: externalReference,
				title,
				description,
				total_amount: totalAmount,
				items,
			};

			console.log('Request body construido:', JSON.stringify(requestBody, null, 2));

			// Construir endpoint dinámico
			const endpoint = `/instore/orders/qr/seller/collectors/${credentials.userId}/pos/${credentials.externalPosId}/qrs`;
			console.log('Endpoint:', endpoint);

			// Llamar a la API
			console.log('Enviando request a MercadoPago...');
			const response = await mercadoPagoApiRequest.call(this, 'POST', endpoint, requestBody);

			console.log('Respuesta exitosa:', JSON.stringify(response, null, 2));
			return [this.helpers.returnJsonArray(response)];
		} catch (error: any) {
			console.error('Error en el nodo:', {
				message: error.message,
				stack: error.stack,
				response: error.response?.data,
			});
			throw error;
		}
	}
}
