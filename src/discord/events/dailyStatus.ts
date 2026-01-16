import { createEvent } from "#base";
import { env } from "#env";
import { getUsuariosStatusMessage } from "../functions/getUsuariosStatus.js";

createEvent({
    name: "Daily Status Report",
    event: "ready",
    once: true,
    async run(client) {
        // Obter horário configurado no .env (padrão: 18:40)
        const sendHour = env.STATUS_SEND_HOUR ?? 18;
        const sendMinute = env.STATUS_SEND_MINUTE ?? 40;
        
        console.log(`✅ Bot está pronto! Agendando envio diário de status às ${String(sendHour).padStart(2, '0')}:${String(sendMinute).padStart(2, '0')}...`);

        let lastSentDate = ""; // Armazenar a data do último envio para evitar duplicatas

        // Função para verificar e enviar mensagem
        async function checkAndSendStatus() {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const todayDate = now.toDateString(); // Data no formato "Mon Jan 01 2024"

            // Verificar se é o horário configurado e se ainda não foi enviado hoje
            if (hour === sendHour && minute === sendMinute && lastSentDate !== todayDate) {
                const channelId = env.STATUS_CHANNEL_ID;
                
                if (!channelId) {
                    console.log("⚠️ STATUS_CHANNEL_ID não configurado no .env. Pulando envio automático.");
                    return;
                }

                try {
                    const channel = await client.channels.fetch(channelId);
                    
                    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
                        console.error(`❌ Canal ${channelId} não encontrado ou não é um canal de texto válido.`);
                        return;
                    }

                    // Type guard para garantir que podemos enviar mensagens
                    if (!("send" in channel)) {
                        console.error(`❌ Canal ${channelId} não suporta envio de mensagens.`);
                        return;
                    }

                    console.log(`📤 Enviando status diário para o canal ${channelId}...`);
                    
                    const statusMessage = await getUsuariosStatusMessage();
                    
                    if (statusMessage.error) {
                        console.error("❌ Erro ao gerar mensagem de status:", statusMessage.error);
                        return;
                    }

                    await (channel as any).send({
                        flags: ["IsComponentsV2"],
                        components: statusMessage.components
                    });

                    lastSentDate = todayDate; // Marcar que foi enviado hoje
                    console.log(`✅ Status diário enviado com sucesso às ${now.toLocaleTimeString('pt-BR')}!`);
                } catch (error: any) {
                    console.error("❌ Erro ao enviar status diário:", error.message);
                }
            }
        }

        // Verificar a cada minuto
        setInterval(checkAndSendStatus, 60000); // 60000ms = 1 minuto

        // Verificar imediatamente ao iniciar (caso o bot reinicie exatamente às 18:40)
        await checkAndSendStatus();
    }
});

