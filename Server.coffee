PORT = parseInt process.argv.splice(2)[0]

curDir = process.cwd() 
express = require "express"
app = express()

app.use express.static "#{curDir}/"

app.get "*", (req, res) -> 
	res.sendfile "#{curDir}/index.html"

app.listen PORT
