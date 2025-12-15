let clients = [];

const addClient = (userId, res) => {
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    userId: userId.toString(),
    res
  };
  clients.push(newClient);

  // console.log(`✅ Notification Client Connected. User: ${userId}. Total Clients: ${clients.length}`);

  // Remove client if connection closes
  res.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    // console.log(`❌ Notification Client Disconnected. User: ${userId}. Total Clients: ${clients.length}`);
  });
};

const sendNotification = (userId, data) => {
  console.log(`🔔 Attempting to notify User: ${userId}`);
  const targetClients = clients.filter(c => c.userId === userId.toString());
  
  if (targetClients.length === 0) {
      // console.log(`⚠️ User ${userId} is not connected. Notification skipped.`);
      return;
  }

  targetClients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
  // console.log(`🚀 Notification sent to ${targetClients.length} client(s).`);
};

module.exports = { addClient, sendNotification };