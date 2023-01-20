import { createServer, request } from 'node:http'
import { createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'
import csvtojson from 'csvtojson'

const PORT = 3000;

createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }

  if (request.method === 'OPTIONS') return res.writeHead(204, headers).end();

  let items = 0;
  
  res.once('close', _ => {
    console.log(`connection was closed! ${items}`);
  })

  Readable.toWeb(createReadStream('./animeflv.csv'))
  .pipeThrough(Transform.toWeb(csvtojson()))
  .pipeThrough(new TransformStream({
    transform(chunk, controller) {
      const chunkParsed = JSON.parse(Buffer.from(chunk).toString())
      const data = {
        title: chunkParsed.title,
        url: chunkParsed.url_anime,
      };

      controller.enqueue(JSON.stringify(data).concat('\n'))
    }
  }))
  .pipeTo(new WritableStream({ 
    async write (chunk) {
      items++;
      res.write(chunk);
    },

    close() {
      console.log('items: ', items);
      res.end()
    }
  }))

  res.writeHead(200, headers)
})
.listen(PORT)
.on('listening', () => console.log(`Server running at: ${PORT}`))