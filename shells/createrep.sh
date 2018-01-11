#! /bin/dash
repUrl=""
while getopts "u:" arg
do
  case $arg in
    u)
      repUrl=$OPTARG;;
    ?)
      exit;;
  esac
done
git clone "$reqUrl"
