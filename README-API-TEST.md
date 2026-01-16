# 🧪 Como Testar a API

## 📋 Pré-requisitos

1. Certifique-se de que o bot está rodando (`npm run dev` ou `npm run start`)
2. O servidor deve estar escutando na porta **8080**

---

## 🚀 Formas de Testar

### **Opção 1: PowerShell (Windows - Recomendado)**

#### Teste rápido interativo:
```powershell
.\test-api.ps1
```

#### Teste direto com parâmetros:
```powershell
.\test-send-message.ps1 -ChannelId "1234567890123456789" -Message "Minha mensagem de teste"
```

#### Comando direto no PowerShell:
```powershell
$body = @{message="Teste!"; channelId="SEU_CHANNEL_ID"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8080/send-message" -Method POST -ContentType "application/json" -Body $body
```

---

### **Opção 2: cURL (Windows/Linux/Mac)**

```bash
curl -X POST http://localhost:8080/send-message `
  -H "Content-Type: application/json" `
  -d "{\"message\": \"Teste via curl!\", \"channelId\": \"SEU_CHANNEL_ID_AQUI\"}"
```

**Linux/Mac:**
```bash
curl -X POST http://localhost:8080/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste via curl!", "channelId": "SEU_CHANNEL_ID_AQUI"}'
```

---

### **Opção 3: Bash Script (Linux/Mac)**

```bash
chmod +x test-api.sh
./test-api.sh
```

---

### **Opção 4: Usando Postman ou Insomnia**

1. **Method:** `POST`
2. **URL:** `http://localhost:8080/send-message`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "message": "Teste via Postman!",
  "channelId": "SEU_CHANNEL_ID_AQUI"
}
```

---

### **Opção 5: Teste no Navegador (apenas GET)**

Para testar a rota principal:
```
http://localhost:8080/
```

---

## 🔍 Como Obter o Channel ID

1. Ative o **Modo Desenvolvedor** no Discord:
   - Configurações → Avançado → Modo Desenvolvedor (ativar)

2. Clique com botão direito no canal desejado
3. Selecione **"Copiar ID"**

---

## 📝 Exemplo Completo

```powershell
# 1. Testar se servidor está online
Invoke-WebRequest -Uri "http://localhost:8080/" -Method GET

# 2. Enviar mensagem
$channelId = "1234567890123456789"  # Substitua pelo ID real
$message = "Olá do PowerShell!"

$body = @{
    message = $message
    channelId = $channelId
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/send-message" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## ✅ Resposta de Sucesso

```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "data": {
    "messageId": "987654321098765432",
    "channelId": "1234567890123456789",
    "content": "Sua mensagem aqui"
  }
}
```

---

## ❌ Possíveis Erros

### Canal não encontrado:
```json
{
  "success": false,
  "error": "Canal não encontrado"
}
```

### Dados inválidos:
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [...]
}
```

---

## 🌐 Para Acesso Externo (n8n)

Se o n8n estiver em outro servidor, use o IP da sua máquina:

**Mesma rede:**
```
http://192.168.1.65:8080/send-message
```

**IP Público (requer port forwarding):**
```
http://177.154.20.84:8080/send-message
```

**Configurar port forwarding:**
- Porta externa: `8080`
- IP interno: `192.168.1.65:8080`
- Protocolo: `TCP`

