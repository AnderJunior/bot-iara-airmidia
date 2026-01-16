import { env } from "#env";
import { ContainerBuilder, TextDisplayBuilder } from "discord.js";

const SUPABASE_URL = "https://lieuifcyvchjrjyanqpg.supabase.co";

export async function getUsuariosStatusMessage() {
    try {
        // Verificar se a chave do Supabase está configurada
        const supabaseKey = env.SUPABASE_KEY;
        if (!supabaseKey) {
            return {
                error: "Chave API do Supabase não configurada",
                components: [
                    new ContainerBuilder()
                        .setAccentColor(15746887)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("❌ **Chave API do Supabase não configurada**\n\nAdicione `SUPABASE_KEY` no arquivo `.env` com sua chave API do Supabase.")
                        )
                ]
            };
        }

        // Buscar dados dos usuários no Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=*,whatsapp_instances(status,telefone)&order=created_at.desc`, {
            method: "GET",
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
        }

        const usuarios: any = await response.json();

        // Filtrar usuários do tipo "administracao" - sempre ocultar
        const usuariosFiltrados = Array.isArray(usuarios) 
            ? usuarios.filter((u: any) => u.tipo !== 'administracao')
            : [];

        if (!Array.isArray(usuarios) || usuariosFiltrados.length === 0) {
            const totalOriginal = Array.isArray(usuarios) ? usuarios.length : 0;
            let mensagem = "⚠️ **Nenhum usuário encontrado**\n\n";
            if (totalOriginal === 0) {
                mensagem += "A tabela 'usuarios' existe e está acessível, mas não há usuários cadastrados.";
            } else {
                mensagem += `Não há usuários do tipo 'cliente' para exibir.\n\n**Total na tabela:** ${totalOriginal} usuário(s)\n**Filtrados (administração oculta):** ${usuarios.filter((u: any) => u.tipo === 'administracao').length} usuário(s)`;
            }

            return {
                components: [
                    new ContainerBuilder()
                        .setAccentColor(7419530)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(mensagem)
                        )
                ]
            };
        }

        // Formatar os dados dos usuários
        const usuariosText = usuariosFiltrados.map((usuario: any) => {
            const nome = usuario.nome || "Sem nome";
            const fase = usuario.fase || "Sem fase";
            const tipo = usuario.tipo || "cliente";
            const ativo = usuario.ativo ? "✅ Ativo" : "❌ Inativo";
            
            // Processar status do WhatsApp
            const whatsappInstances = usuario.whatsapp_instances || [];
            let statusWhatsApp = "❌ Sem WhatsApp";
            
            if (Array.isArray(whatsappInstances) && whatsappInstances.length > 0) {
                const instance = whatsappInstances[0];
                const status = instance.status || "desconectado";
                
                switch (status) {
                    case "conectado":
                        statusWhatsApp = "✅ Conectado";
                        break;
                    case "conectando":
                        statusWhatsApp = "🔄 Conectando...";
                        break;
                    case "desconectado":
                        statusWhatsApp = "❌ Desconectado";
                        break;
                    case "erro":
                        statusWhatsApp = "⚠️ Erro";
                        break;
                    default:
                        statusWhatsApp = `❓ ${status}`;
                }
            }
            
            return `### **${nome}**\n└ Fase: \`${fase}\` \n└ Tipo: \`${tipo}\` \n└ ${ativo} \n└ WhatsApp: ${statusWhatsApp}`;
        }).join("\n\n");

        // Resumos
        const totalUsuarios = usuariosFiltrados.length;
        const totalClientes = usuariosFiltrados.filter((u: any) => u.tipo === 'cliente').length;
        const totalAdminOcultos = Array.isArray(usuarios) ? usuarios.filter((u: any) => u.tipo === 'administracao').length : 0;
        const totalAtivos = usuariosFiltrados.filter((u: any) => u.ativo === true).length;
        const totalInativos = usuariosFiltrados.filter((u: any) => u.ativo === false).length;
        
        // Resumo por status do WhatsApp
        const statusWhatsAppResumo: Record<string, number> = {};
        usuariosFiltrados.forEach((usuario: any) => {
            const instances = usuario.whatsapp_instances || [];
            if (Array.isArray(instances) && instances.length > 0) {
                const status = instances[0].status || "desconectado";
                statusWhatsAppResumo[status] = (statusWhatsAppResumo[status] || 0) + 1;
            } else {
                statusWhatsAppResumo["sem_whatsapp"] = (statusWhatsAppResumo["sem_whatsapp"] || 0) + 1;
            }
        });
        
        const resumoWhatsApp = Object.entries(statusWhatsAppResumo)
            .map(([status, count]) => {
                const statusMap: Record<string, string> = {
                    "conectado": "✅ Conectado",
                    "conectando": "🔄 Conectando",
                    "desconectado": "❌ Desconectado",
                    "erro": "⚠️ Erro",
                    "sem_whatsapp": "📵 Sem WhatsApp"
                };
                return `${statusMap[status] || status}: ${count}`;
            })
            .join(" | ");

        // Resumo por fase
        const faseResumo = usuariosFiltrados.reduce((acc: any, usuario: any) => {
            const fase = usuario.fase || "Sem fase";
            acc[fase] = (acc[fase] || 0) + 1;
            return acc;
        }, {});

        const resumoFase = Object.entries(faseResumo)
            .map(([fase, count]) => `\`${fase}\`: ${count}`)
            .join(" | ");

        // Resumo por tipo de marcação
        const marcacaoResumo = usuariosFiltrados.reduce((acc: any, usuario: any) => {
            const marcacao = usuario.tipo_marcacao || "Sem marcação";
            acc[marcacao] = (acc[marcacao] || 0) + 1;
            return acc;
        }, {});

        const resumoMarcacao = Object.entries(marcacaoResumo)
            .map(([marcacao, count]) => `\`${marcacao}\`: ${count}`)
            .join(" | ");

        const conteudo = `📊 **Status Completo dos Usuários**\n\n` +
            `**Resumo Geral:**\n` +
            `• Total exibido: ${totalUsuarios} usuário(s)${totalAdminOcultos > 0 ? ` (${totalAdminOcultos} administração oculta)` : ''}\n` +
            `• Clientes: ${totalClientes}\n` +
            `• Ativos: ${totalAtivos} | Inativos: ${totalInativos}\n\n` +
            `**Status WhatsApp:**\n${resumoWhatsApp || 'N/A'}\n\n` +
            `**Por Fase:**\n${resumoFase || 'N/A'}\n\n` +
            `**Por Tipo de Marcação:**\n${resumoMarcacao || 'N/A'}\n` +
            `${usuariosText}`;

        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(7419530)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(conteudo)
                    )
            ]
        };
    } catch (error: any) {
        console.error("Erro ao buscar usuários:", error);
        return {
            error: error.message || "Erro desconhecido",
            components: [
                new ContainerBuilder()
                    .setAccentColor(15746887)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`❌ **Erro ao buscar usuários**\n\n\`\`\`${error.message || "Erro desconhecido"}\`\`\``)
                    )
            ]
        };
    }
}

