import WebSocket from 'ws';


console.log("※");
const ws = new WebSocket('wss://ftx.com/ws/');

ws.OPEN
ws.on('open', () => {
        console.log("opened")
        setInterval(() => {

                ws.ping()

        }, 15000);
        ws.send(Buffer.from(JSON.stringify({ op: 'subscribe', channel: 'trades', market: 'USDT/USD' })))
})



ws.on('message', (m: any)=> {
        var  msg = JSON.parse ( m )
        console.log( msg.channel);
        console.log( msg.data);
});

const s = { "channel": "orderbook", "market": "USDT/USD", "type": "update", "data": { "time": 1636588289.8350513, "checksum": 2802713328, "bids": [], "asks": [[1.0003, 1956731.57]], "action": "update" } }


ws.on('pong', () => {

});