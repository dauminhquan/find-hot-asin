let express = require('express');
let router = express.Router();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require('axios')
const excel = require('node-excel-export');
var Product = require('../model/products')
const fs = require("fs");
const csv = require('fast-csv')
/* GET home page. */
router.get('/', function(req, res, next) {
    return res.render('index');
});
router.post('/find-product',function(req,res,next) {
  let url = req.body.url;
  let key = req.body.key
    let minReview = req.body.minReview
    let maxReview = req.body.maxReview
    let depth = req.body.depth
  findProduct(url,res.io,key,minReview,maxReview,depth)
    return res.json({
        'message' : "ok"
    })
})
router.get('/manage',function (req,res,next) {
    Product.find({},function(err,products){
        if(err)
        {
           return res.status(500).json({
                message: "error"
            })
        }
        let root_urls = []
        products.forEach(product => {
            if(!root_urls.includes(product.root_url))
            {
                root_urls.push(product.root_url)
            }

        })
        return res.render('manage',{
            root_urls: root_urls
        })
    })

})
router.post('/manage',function (req,res,next) {
    let root_url = req.body.root_url
    Product.find({},function(err,products){
        if(err)
        {
            return res.status(500).json({
                message: "error"
            })
        }
        let root_urls = []
        let product_find = []
        products.forEach(product => {
            if(!root_urls.includes(product.root_url))
            {
                root_urls.push(product.root_url)
            }
            if(product.root_url == root_url)
            {
                product_find.push(product)
            }

        })
        return res.render('manage_post',{
            root_urls: root_urls,
            product_find: product_find,
            root_url: root_url
        })
    })

})
router.post('/manage/upload-csv',function (req,res,next) {
    if (req.files) {
        let file = req.files.csvFile
        let fileName = new Date().getMilliseconds().toString()
        file.mv('./'+fileName,function(err){
            const stream = fs.createReadStream('./'+fileName)
            const streamCsv = csv({
                headers: true,
                delimiter:',',
                quote: '"'
            }).on('data',data => {
                Product.findOne({
                    asin: data.asin
                },(err,product) => {
                    if(err)
                    {
                        console.log(err)
                    }
                    else{
                        product.reject = true
                        product.save((error,document) => {
                            if(error)
                            {
                                console.log(error)
                            }
                        })
                    }
                })
            }).on('end',() => {
                fs.unlink('./'+fileName,function (err) {
                    if(err)
                    {
                        console.log(err)
                        return res.status(500).json(err)
                    }
                    let root_url = req.body.root_url
                    Product.find({},function(err,products){
                        if(err)
                        {
                            return res.status(500).json({
                                message: "error"
                            })
                        }
                        let root_urls = []
                        let product_find = []
                        products.forEach(product => {
                            if(!root_urls.includes(product.root_url))
                            {
                                root_urls.push(product.root_url)
                            }
                            if(product.root_url == root_url)
                            {
                                product_find.push(product)
                            }

                        })
                        return res.render('manage_post',{
                            root_urls: root_urls,
                            product_find: product_find,
                            root_url: root_url
                        })
                    })
                })
            }).on('error',(err) => {
                return res.status(500).json(err)
            })
            stream.pipe(streamCsv)
        })
    }
    else{
        res.status(406).json({
            message: 'error'
        })
    }
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

    Product.find({ root_url: root_url,reject: false}, function (error, docs) {
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
async function getUrl(url,index,keyword,root_url,minReview,maxReview,depth)
{
    await axios.get(url).then( async response => {
        const { window } = new JSDOM(response.data);
        const $ = require('jquery')(window);
        let current = $('span.zg_selected').text()
        let uls = $('span.zg_selected').parent().next('ul')
        if(uls.length > 0 && index < depth)
        {
            let lis = uls.find('li')
            if(lis.length > 0 )
            {
                for(let i = 0 ; i < lis.length ; i ++)
                {
                    let urlData = $(lis[i]).find('a:eq(0)').attr('href')
                    await getUrl(urlData.slice(0,urlData.indexOf('/ref=')),index+1,keyword == '' ? current : keyword+'-'+current,root_url,minReview,maxReview,depth)
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
                getUrl(url+'/?pg=2',index,keyword == '' ? current : keyword+'-'+current,root_url,minReview,maxReview,depth)
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
                    if(review < maxReview && review > minReview)
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
                    let product = {
                        asin: arr_str[3],
                        url_product: item.url,
                        keyword: keyword == '' ? current : keyword+'-'+current,
                        rank : item.rank,
                        review: item.review,
                        url_found: url,
                        root_url: root_url,
                        created_at: new Date()
                    }
                    Product.findOneAndUpdate(
                        {asin: product.asin},
                        product,
                        {upsert: true, new: true, runValidators: true},
                        function (err, data) { // callback
                            console.log(err)
                            if(err)
                            {
                                console.log('trung ASIN',arr_str[3])
                            }
                            else{
                                console.log(data.asin,data.keyword)
                            }
                        }
                    )
                    asins.push(arr_str[3])
                })
            }
        }
    }).catch(err => {
        console.log('bị chặn')
    })
}
async function findProduct(url,socket,key,minReview,maxReview,depth){
    await getUrl(url,1,'',url,minReview,maxReview,depth)
    socket.emit(key,{
        message: 'done',
        root_url: url
    })
}
module.exports = router;
