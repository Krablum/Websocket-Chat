class ClientFrame{ 
    
    constructor(hexBuffer){
        this.mainWSBuffer = hexBuffer.toString("hex")
        this.lenIndicator;
        this.FIN = hexBuffer[0] >> 7
        this.RSV = (hexBuffer[0] >> 4)^(this.FIN << 3)
        this.OPCODE = (hexBuffer[0])^((hexBuffer[0]>>4)<< 4)
        this.MASK = hexBuffer[1] >> 7
        this.PAYLOAD_LEN = (()=>{
            const length = hexBuffer[1]^((hexBuffer[1]>> 7)<<7)
            this.lenIndicator = length;

            if(length <= 125){
                return length
            }
            
            if(length === 126){
               return hexBuffer.readUInt16BE(2)
            }
            if(length === 127){

                return hexBuffer.readBigUInt64BE(2)
            }
        })()
        this.MASKING_KEY = (()=>{
            if(this.MASK === 1){

                if(this.lenIndicator <= 125){
                        return hexBuffer.slice(2,6)
                }
                    

                if(this.lenIndicator === 126){
                        return hexBuffer.slice(4,8)
                }    

                if(this.lenIndicator === 127){
                        return hexBuffer.slice(10,14)
                }
                
            }
        })()
        this.PAYLOAD_DATA = (()=>{

            if(this.lenIndicator <= 125){
                return hexBuffer.slice(6,hexBuffer.length)
            }

            if(this.lenIndicator === 126){
                return hexBuffer.slice(8,hexBuffer.length)
            }

            if(this.lenIndicator === 127){
                return hexBuffer.slice(10,hexBuffer.length)
            }
        })()
        this.DATA;
        this.MESSAGE;
    }

    DecodeData(){
        let originalData = this.PAYLOAD_DATA
        let maskingKey = this.MASKING_KEY
        let transformedData = new Uint8Array(originalData.length);

            for(let i = 0, il = originalData.length; i < il; i++){
                let j = i % 4
                
                transformedData[i] = originalData[i]^maskingKey[j]
            }
            this.DATA = Buffer.from(transformedData)
            this.MESSAGE = this.DATA.toString("utf-8")
    }
}

/**
 * TODO: the class below is only with opcode %x1 which is the text type data
 * 
 * TODO: RSV only result with no negoation change it to be more flexable
 */
class ServerFrame{
    constructor(payloadData){
        this.FIN = 0b1
        this.RSV = 0b000
        this.OPCODE = 0b0001
        this.MASK = 0b0
        this.PAYLOAD_LEN = payloadData.length
        this.PAYLOAD_DATA = Buffer.from(payloadData)
        this.frame = (()=>{
            if(payloadData.length <= 125){
                let frameArray = new ArrayBuffer(2+Buffer.from(payloadData).length)
                let view8 = new Uint8Array(frameArray)

                view8[0]= (((this.FIN<<3)^this.RSV)<<4)^this.OPCODE
                view8[1]= (this.MASK << 7)^this.PAYLOAD_LEN

                for(let i = 2, il = this.PAYLOAD_LEN+2; i < il; i++){
                    view8[i] = this.PAYLOAD_DATA[i-2]
                }

                return(Buffer.from(frameArray))
            }

        

            


            return frameArray
        })()
    }
}



module.exports.ClientFrame = ClientFrame
module.exports.ServerFrame = ServerFrame