let express = require('express');
let router = express.Router();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require('axios')
const excel = require('node-excel-export');
var Product = require('../model/products')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/find-product',function(req,res,next) {
  let url = req.body.url;
    findProduct(url,res.io)
    return res.json({
        'message' : "ok"
    })
})
router.get('/get-asin',function (req,res,next) {
    let root_url = req.query.root_url
    const styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF000000'
                }
            },
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 14,
                bold: true,
                underline: true
            }
        },
        cellPink: {
            fill: {
                fgColor: {
                    rgb: 'FFFFCCFF'
                }
            }
        },
        cellGreen: {
            fill: {
                fgColor: {
                    rgb: 'FF00FF00'
                }
            }
        }
    };
    /*const heading = [
        [
            {value: 'a1', style: styles.cellGreen},
            {value: 'a2', style: styles.cellGreen},
            {value: 'a3', style: styles.cellGreen},
            {value: 'a4', style: styles.cellGreen},
            {value: 'a5', style: styles.cellGreen},
            {value: 'a6', style: styles.cellGreen},
            {value: 'a7', style: styles.cellGreen},
            {value: 'a8', style: styles.cellGreen},
            {value: 'a9', style: styles.cellGreen}
        ]
    ];*/
    const specification = {
        asin: {
            displayName: 'Asin', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        keyword:{
            displayName: 'Keyword', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        created_at: {
            displayName: 'Date time created', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        reject: {
            displayName: 'Disable', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        rank: {
            displayName: 'Rank', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        review: {
            displayName: 'Review size', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        root_url: {
            displayName: 'Url find', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        url_found: {
            displayName: 'Url found', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        },
        url_product: {
            displayName: 'Url Product', // <- Here you specify the column header
            headerStyle: styles.cellGreen, // <- Header style
            width: 120 // <- width in pixels
        }
    }

    Product.find({ root_url: root_url}, function (error, docs) {
        if(error)
        {
           return res.status(500).json(error)
        }
        const report = excel.buildExport(
            [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
                {
                    name: 'ASIN', // <- Specify sheet name (optional)
                    // heading: heading, // <- Raw heading array (optional)
                    specification: specification, // <- Report specification
                    data: docs // <-- Report data
                }
            ]
        );
        let date = new Date()
        let currentTime = date.getFullYear()+'_'+(date.getMonth() + 1) + '_'+date.getDate()+'_'+date.getHours()+'_'+date.getMinutes()+
            '_'+date.getSeconds()
        res.attachment('report_'+currentTime+'.xlsx'); // This is sails.js specific (in general you need to set headers)
        return res.send(report);
        // return res.json(docs)

    });
})
async function getUrl(url,index,keyword,root_url)
{
    await axios.get(url).then( async response => {
        const { window } = new JSDOM(response.data);
        const $ = require('jquery')(window);
        let current = $('span.zg_selected').text()
        let uls = $('span.zg_selected').parent().next('ul')
        if(uls.length > 0 && index < 2)
        {
            let lis = uls.find('li')
            if(lis.length > 0 )
            {
                for(let i = 0 ; i < lis.length ; i ++)
                {
                    let urlData = $(lis[i]).find('a:eq(0)').attr('href')
                    await getUrl(urlData.slice(0,urlData.indexOf('/ref=')),index+1,keyword == '' ? current : keyword+'-'+current,root_url)
                }
            }
            else{
                console.log('error')
            }

        }
        else{
            let products = $('li.zg-item-immersion')
            let aLast = $(".a-last:eq(0)")
            let urlNext = $(aLast).find('a')
            if(urlNext.length > 0)
            {
                getUrl(url+'/?pg=2',index,keyword == '' ? current : keyword+'-'+current,root_url)
            }
            let linkProducts = []
            for(let i = 0 ; i < products.length ; i++)
            {
                let reviews = $(products[i]).find('a.a-size-small.a-link-normal')
                if(reviews.length < 1)
                {
                    reviews = reviews[0]
                    let linkProduct = $(products[i]).find('a.a-link-normal:eq(0)').attr('href')
                    let rank = $(products[i]).find('.zg-badge-text:eq(0)').text()
                    if(linkProduct != undefined)
                    {
                        linkProducts.push({
                            url: linkProduct,
                            rank: rank,
                            review: 0,
                            root_url: root_url,
                            url_found: url
                        })
                    }
                }
                else{
                    let review = parseInt($(reviews).text().replace(/,/g,''))
                    if(review < 10)
                    {
                        let rank = $(products[i]).find('.zg-badge-text:eq(0)').text()
                        let linkProduct = $(products[i]).find('a.a-link-normal:eq(0)').attr('href')
                        linkProducts.push({
                            url: linkProduct,
                            rank: rank,
                            review: review
                        })
                    }
                }
            }
            let asins = []
            if(linkProducts.length > 0)
            {
                linkProducts.forEach(item => {
                    let arr_str = item.url.split('/')
                    let product = new Product({
                        asin: arr_str[3],
                        url_product: item.url,
                        keyword: keyword == '' ? current : keyword+'-'+current,
                        rank : item.rank,
                        review: item.review,
                        url_found: url,
                        root_url: root_url
                    })
                    product.save(function(err,data){
                        if(err)
                        {
                            console.log('trung ASIN',arr_str[3])
                        }
                        else{
                            console.log(data.asin,data.keyword)
                        }
                    })
                    asins.push(arr_str[3])
                })
            }
        }
    }).catch(err => {
        console.log('bị chặn')
    })
}

async function findProduct(url,socket){
    await getUrl(url,1,'',url)
    socket.emit('done',{
        message: 'done',
        root_url: url
    })
}
module.exports = router;
