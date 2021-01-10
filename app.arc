@app
begin-app

@http
get /
post /trello-hook

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
