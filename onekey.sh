#!/usr/bin/env bash

# author:xuedingmiaojun
# site:xuedingmiao.com

# MyWxappUnpacker 项目路径
WXAPPUNPACKER_PATH=`pwd`

FILE_FORMAT=wxapkg

wxappUnpacker_pkg() {
  echo "node ${WXAPPUNPACKER_PATH}/wuWxapkg.js ${fname} $main_pkg"
  node ${WXAPPUNPACKER_PATH}/wuWxapkg.js $main_pkg ${fname}
  return 0;
}

wxappUnpacker() {
  folder_name=$main_pkg
  de_dir=$dir
    if [ -z "$dir" ]
      then de_dir=`pwd`
    fi
  for fname in `find ${de_dir} -name "*.${FILE_FORMAT}"`
    do
      file_name=${fname##*/};
      echo "分包:${file_name}";
      short_name=${file_name%*.wxapkg};

      folder=${folder_name##*/};
      if [ $short_name != $folder ]
        then
          # 子包目录如果存在就先删除
          subpackage_path=${fname%*.wxapkg}
          if [ -d $subpackage_path ]
            then rm -rf $subpackage_path
          fi
          wxappUnpacker_pkg ${file_name} $main_pkg
      fi
    done
  return 0;
}

de_pkg() {
  dir=`dirname $1`
  tmp_pkg=$1
  path=${tmp_pkg%%.wxapkg}
  main_pkg="-s=${path}"
  echo "包文件存放目录:${dir}"
  # 判断主包是否已经解开
  order=$main_pkg
  folder_name=${order##*=}
  echo "主包目录:${folder_name}"
  # 没解主包时先解主包
  if [ ! -d $folder_name ]
    then
      echo "主包名:${folder_name}.wxapkg"
      node wuWxapkg.js "${folder_name}.wxapkg"
  fi
  # 解分包
  wxappUnpacker $dir $main_pkg
  return 0;
}
# $1: main pkg file
de_pkg $1


