# Usa uma imagem oficial do Node.js como base
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o package.json e package-lock.json (se existir)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o código para dentro do container
COPY . .

# Expõe a porta onde o app vai correr
EXPOSE 3005

# Comando para arrancar a app
CMD ["node", "server.js"]