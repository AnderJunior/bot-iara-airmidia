import { createCommand } from "#base";
import { ApplicationCommandType, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { getUsuariosStatusMessage } from "../../functions/getUsuariosStatus.js";

createCommand({
    name: "test-supabase",
    description: "Teste de busca completa dos status dos usuários no Supabase 🔍",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        await interaction.deferReply();

        try {
            const statusMessage = await getUsuariosStatusMessage();
            
            await interaction.editReply({
                flags: ["IsComponentsV2"],
                components: statusMessage.components
            });
        } catch (error: any) {
            console.error("Erro ao buscar usuários:", error);

            const errorMessage = error.message || "Erro desconhecido ao buscar dados do Supabase";
            
            const components = [
                new ContainerBuilder()
                    .setAccentColor(15746887)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`❌ **Erro ao buscar usuários**\n\n\`\`\`${errorMessage}\`\`\`\n\n**Dicas:**\n- Verifique se a chave **secret** (service role) está correta\n- Verifique se a tabela 'usuarios' existe no Supabase\n- Confira os logs do bot para mais detalhes técnicos`)
                    )
            ];

            await interaction.editReply({
                flags: ["IsComponentsV2"],
                components: components
            });
        }
    }
});

