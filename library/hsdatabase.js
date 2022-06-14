#!/usr/local/bin/hsscript -f

hsdatabase(arguments);

function getParam(paramName, paramsString) {
  re = new RegExp(paramName + "\=\'([^\']*)\'");
  matches = re.exec(paramsString);
  if (matches != null) {
    return matches[1];
  } else {
    re = new RegExp(paramName + "\=([^ ]*)");
    matches = re.exec(paramsString);
    if (matches != null) {
      return matches[1];
    } else {
      return null;
    }
  }
}

function hsdatabase(args) {
  reader = new java.io.BufferedReader(new java.io.FileReader(args[0]));
  params = reader.readLine();
  reader.close();
  instance = getParam("instance", params);
  if (instance == null) {
    print('{"failed":true,"msg":"parameter instance required, allowed values: mysql, postgresql"}');
    return;
  }
  var dbusermodule;
  var dbmodule;
  if (!"mysql".localeCompare(instance)) {
    dbusermodule = mysqluser;
    dbmodule = mysqldb;
  }
  if (!"postgresql".localeCompare(instance)) {
    dbusermodule = postgresqluser;
    dbmodule = postgresqldb;
  }
  if (dbusermodule === undefined || dbmodule === undefined) {
    print('{"failed":true,"msg":"parameter instance required, allowed values: mysql, postgresql"}');
    return;
  }
  databasename = getParam("name", params);
  if (databasename == null) {
    print('{"failed":true,"msg":"parameter name required"}');
    return;
  }
  databaseuser = getParam("user", params);
  if (databaseuser == null) {
    print('{"failed":true,"msg":"parameter user required"}');
    return;
  }
  passwd = getParam("password", params);
  if (passwd == null) {
    print('{"failed":true,"msg":"parameter password required"}');
    return;
  }
  shouldExist = getParam("exists", params);
  if (shouldExist == null) {
    print('{"failed":true,"msg":"parameter exists with value true or false required"}');
    return;
  }
  existingUsers = dbusermodule.search({where:{name:databaseuser}});
  existingDBs = dbmodule.search({where:{name:databasename}});
  if ("false".localeCompare(shouldExist)) {
    if (existingUsers.length < 1) {
      try {
        dbusermodule.add({set:{name:databaseuser,password:passwd}});
      }
      catch (e) {
        print('{"failed":true,"msg":"' + String(e) + '"}');
      }
    } else {
      try {
        dbusermodule.update({where:{name:databaseuser},set:{password:passwd}});
      }
      catch (e) {
        print('{"failed":true,"msg":"' + String(e) + '"}');
      }
    }
    if (existingDBs.length < 1) {
      try {
        dbmodule.add({set:{name:databasename,owner:databaseuser}});
        print('{"changed":true,"msg":"added"}');
      }
      catch (e) {
        print('{"failed":true,"msg":"' + String(e) + '"}');
      }
    } else {
      try {
        dbmodule.update({where:{name:databasename},set:{owner:databaseuser}});
        print('{"changed":false,"msg":"updated"}');
      }
      catch (e) {
        print('{"failed":true,"msg":"' + String(e) + '"}');
      }
    }
  } else {
    if (existingUsers.length > 0) {
      try {
        dbmodule.remove({where:{name:databasename}});
        if (databasename == databaseuser) {
            dbusermodule.remove({where:{name:databaseuser}});
        }
        print('{"changed":true,"msg":"removed"}');
      }
      catch (e) {
        print('{"failed":true,"msg":"' + String(e) + '"}');
      }
    } else {
      print('{"changed":false,"msg":"absent"}');
    }
  }
}
