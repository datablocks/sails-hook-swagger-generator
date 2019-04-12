module.exports = (method_path)=>{


  let split = method_path.split(' ')
  let method = split[0]
  let path = split[1]

  if(path.startsWith('/'))  // get rid of leading slash
      path = path.substring(1)

  let parts = path.split('/')

  let controller = parts[0]

  if(method == 'get'){
      if(parts.length<2){
          action = 'find'
      }else{
          action = 'findOne'
      }
  }else if(method == 'post'){
      action = 'create'
  }else if(method == 'patch'){
      action = 'update'
  }else if(method == 'delete'){
      if(parts.length<3){  //DELETE /boat/:id
          action = 'destroy'
      }else{
          action = 'remove' // DELETE /boat/:id/drivers/:fk
      }
  }else if(method == 'put'){
      if(parts.length<4){  //DELETE /boat/:id
          action = 'add'
      }else{
          action = 'replace' // DELETE /boat/:id/drivers/:fk
      }
  }
  return {controller,action}
}
