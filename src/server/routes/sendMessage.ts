import { Client, DiscordAPIError } from "discord.js";
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

// Schema de validação para o corpo da requisição
const sendMessageSchema = z.object({
    message: z.string().min(1, "A mensagem não pode estar vazia"),
    channelId: z.string().min(1, "O ID do canal é obrigatório")
});

export function sendMessageRoute(app: FastifyInstance, client: Client<true>) {
    // Rota de teste para verificar se o servidor está respondendo
    app.get("/test", async (_, res) => {
        return res.status(StatusCodes.OK).send({
            success: true,
            message: "Servidor está funcionando!",
            timestamp: new Date().toISOString()
        });
    });

    app.post("/send-message", async (req, res) => {
        console.log("📨 Requisição recebida em /send-message");
        console.log("Body recebido:", req.body);
        
        try {
            // Validar o corpo da requisição
            const validationResult = sendMessageSchema.safeParse(req.body);
            
            if (!validationResult.success) {
                console.log("❌ Validação falhou:", validationResult.error.issues);
                return res.status(StatusCodes.BAD_REQUEST).send({
                    success: false,
                    error: "Dados inválidos",
                    details: validationResult.error.issues
                });
            }

            const { message, channelId } = validationResult.data;
            console.log(`📤 Tentando enviar mensagem para canal: ${channelId}`);

            // Buscar o canal com tratamento de erro específico
            let channel;
            try {
                channel = await client.channels.fetch(channelId);
            } catch (error) {
                // Tratar especificamente o erro de canal desconhecido
                if (error instanceof DiscordAPIError) {
                    if (error.code === 10003) {
                        // Unknown Channel
                        console.log(`❌ Canal ${channelId} não existe ou o bot não tem acesso`);
                        return res.status(StatusCodes.NOT_FOUND).send({
                            success: false,
                            error: "Canal não encontrado ou inacessível",
                            details: "O canal especificado não existe ou o bot não tem permissão para acessá-lo. Verifique se o ID do canal está correto e se o bot está no servidor."
                        });
                    } else if (error.code === 50001) {
                        // Missing Access
                        console.log(`❌ Bot não tem acesso ao canal ${channelId}`);
                        return res.status(StatusCodes.FORBIDDEN).send({
                            success: false,
                            error: "Sem acesso ao canal",
                            details: "O bot não tem permissão para acessar este canal. Verifique as permissões do bot no servidor."
                        });
                    }
                }
                // Re-lançar o erro se não for um erro conhecido de canal
                throw error;
            }

            if (!channel) {
                console.log(`❌ Canal ${channelId} não encontrado`);
                return res.status(StatusCodes.NOT_FOUND).send({
                    success: false,
                    error: "Canal não encontrado"
                });
            }

            // Verificar se o canal é de texto e pode enviar mensagens
            if (!channel.isTextBased() || channel.isDMBased()) {
                console.log(`❌ Canal ${channelId} não é um canal de texto válido`);
                return res.status(StatusCodes.BAD_REQUEST).send({
                    success: false,
                    error: "O canal especificado não é um canal de texto válido"
                });
            }

            // Type guard para garantir que podemos enviar mensagens
            if (!("send" in channel)) {
                console.log(`❌ Canal ${channelId} não suporta envio de mensagens`);
                return res.status(StatusCodes.BAD_REQUEST).send({
                    success: false,
                    error: "O canal não suporta envio de mensagens"
                });
            }

            // Enviar a mensagem
            console.log(`✅ Enviando mensagem: "${message}"`);
            const sentMessage = await channel.send(message);
            console.log(`✅ Mensagem enviada com sucesso! ID: ${sentMessage.id}`);

            return res.status(StatusCodes.OK).send({
                success: true,
                message: "Mensagem enviada com sucesso",
                data: {
                    messageId: sentMessage.id,
                    channelId: channel.id,
                    content: message
                }
            });

        } catch (error) {
            console.error("❌ Erro ao enviar mensagem:", error);
            
            // Tratar erros específicos do Discord
            if (error instanceof DiscordAPIError) {
                if (error.code === 10003) {
                    return res.status(StatusCodes.NOT_FOUND).send({
                        success: false,
                        error: "Canal não encontrado",
                        details: "O canal especificado não existe ou o bot não tem acesso a ele."
                    });
                } else if (error.code === 50001) {
                    return res.status(StatusCodes.FORBIDDEN).send({
                        success: false,
                        error: "Sem permissão",
                        details: "O bot não tem permissão para acessar ou enviar mensagens neste canal."
                    });
                } else if (error.code === 50013) {
                    return res.status(StatusCodes.FORBIDDEN).send({
                        success: false,
                        error: "Permissão insuficiente",
                        details: "O bot não tem permissão para enviar mensagens neste canal."
                    });
                }
            }
            
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                success: false,
                error: "Erro ao enviar mensagem",
                details: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    });
}

