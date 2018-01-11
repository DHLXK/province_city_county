const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');

superagent.get('http://www.stats.gov.cn/tjsj/tjbz/xzqhdm/201703/t20170310_1471429.html')
  .end(function(err, res) {
    if(err) throw Error(err);

    const $ = cheerio.load(res.text);
    let Province = [];
    let City = [];
    let County = [];
    let prevSpaceLength;

    $('.MsoNormal').each(function(item) {
      let name;
      if( $(this).find('>b').length !== 0) {
        name = $(this).find('>b:last-of-type>span').text();  
      } else {
        name = $(this).find('span:last-of-type').text();
      }

      // 去掉空格（不知是什么字符，类似于空格的样式）
      let realName = name.trim();
      // 通过对比空格的长度来决定当前是第几级
      // 0: 第一级， 10: 第二级， 7: 第三级
      let spaceLength = name.length - realName.length;

      // 如果当前值为0，则说明已经过了一轮省，则将City赋值给最后一个Province的children
      if( spaceLength === 0 && prevSpaceLength === 7) {
        City[City.length - 1].children = County;
        Province[Province.length - 1].children = City;
        County = [];
        City = [];
      } else if( spaceLength === 10 && prevSpaceLength === 7) {
        // 如果当前值为10，且前一个值为7，则说明County已经轮完一轮且下一个还是为市，此时赋值给最后一个City
        City[City.length - 1].children = County;
        County = [];
      }

      // 将值处理为正确的格式（element-ui多级联动所需格式）
      realName = handleData(realName);
      // prevSpaceLenth赋值
      prevSpaceLength  = spaceLength;
      if( spaceLength === 0 ) {
        // 第一级
        Province.push(realName);
      } else if ( spaceLength === 10 ) {
        // 第二级
        City.push(realName);
      } else {
        // 第三级
        County.push(realName);
      }

    })

    console.log(Province);

    fs.writeFile('./data.json', JSON.stringify(Province), function(err) {
      if(err) throw Error(err);
    })
  })


function handleData (str) {
  return {
    value: str,
    label: str
  }
}