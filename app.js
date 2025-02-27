const express = require("express");
const http = require("http");
const crypto = require("crypto");
const { error } = require("console");
const wslib = require("./ws");
const { Socket } = require("dgram");

const clients = new Set()

const app = express();
const server = http.createServer(app); // Create an HTTP server
const port = 5050


app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get("/test", (req, res) => {
  res.write("hello");
});

server.on("upgrade", (req, socket, head) => {
  if(req.headers["upgrade"] == "websocket"){
  
      const clientKey = req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
      const acceptKey = Buffer.from(crypto.hash("sha1", clientKey), "hex").toString("base64")
      console.log(clientKey)

      const headers = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptKey}`,
        "\r\n"
      ].join("\r\n");

      socket.write(headers);
      clients.add(socket)

      console.log(req.headers)
      socket.on('data', (data)=>{
        let wsDecoder = new wslib.ClientFrame(data)
        wsDecoder.DecodeData()
        console.log(wsDecoder.MESSAGE)
        let ServerData = new wslib.ServerFrame(wsDecoder.MESSAGE)


        clients.forEach((client)=>{
          client.write(ServerData.frame)
        })

  
        
      })
    } 
  else{
    socket.destroy(error("upgrade isn't websocket"))
  }
  }
)

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
