class WSlib{

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

let foo = new WSlib(Buffer.from("81 8c 49 e5 80 ee 01 80 ec 82 26 c5 d3 8b 3b 93 e5 9c".replaceAll(" ",""), "hex"))

foo.DecodeData()

exports.WSlib = WSlib