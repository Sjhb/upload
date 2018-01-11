#! /bin/sh
# 1.获取传入的仓库地址（-r reposity）
# 2.拉取项目代码到本地
# 3.打包项目
# 4.部署项目
REP=""
while getopts "r:" arg
do
  case $arg in
    r)
      REP=$OPTARG;;
    ?)
      echo "unkonw argument"
      eixt;;
  esac
done
if [ x$REP != x ]
  then
    git checkout 'feature/szd_initProject20171008'
    git pull
    #npm run deploy
    npm run dev
else
  echo "仓库地址为空"
fi


