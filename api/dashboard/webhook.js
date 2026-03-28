// api/webhook.js for Azure Static Web Apps
module.exports = async function (context, req) {
  context.log('Webhook received:', req.body);
  
  try {
    const data = req.body;
    
    // Validate incoming data
    if (!data?.bin || !data?.last4) {
      context.res = {
        status: 400,
        body: { error: 'Invalid data' }
      };
      return;
    }
    
    // Store in Azure Table Storage
    const entity = {
      PartitionKey: data.bin,
      RowKey: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      bin: data.bin,
      last4: data.last4,
      timestamp: new Date().toISOString(),
      source: 'cf_worker'
    };
    
    context.bindings.outputTable = entity;
    
    context.res = {
      status: 200,
      body: { success: true, id: entity.RowKey }
    };
    
  } catch (error) {
    context.log.error('Webhook error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};
