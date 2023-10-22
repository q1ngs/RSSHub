// https://maronyea.me/restless/72/
// https://blog.zhuomu.xyz/2020/07/22/RSSHub-with-university/

const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    const rootUrl = 'https://www.securonix.com/blog/?category%5B%5D=threat-research&keyword=#listing-section';
    const response = await got({
        method: 'get',
        url: rootUrl,
    });
    const $ = cheerio.load(response.data); // 使用 cheerio 加载返回的 HTML
    const lists = $('div.col-md-4');

    const items =
        lists &&
        lists
            .map((index, item) => {
                item = $(item);
                return {
                    title: item.find('h5').text(),
                    link: item.find('a').attr('href'),
                    pubDate: parseDate(item.find('p.date').text()),
                };
            })
            .get();

    const itema = await Promise.all(
        items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);

                // 选择类名为“comment-body”的第一个元素
                item.description = $('section.post-text-content').first().html();

                // 上面每个列表项的每个属性都在此重用，
                // 并增加了一个新属性“description”
                return item;
            })
        )
    );

    // 打印 items 中每个 item 的 title 值
    // items.forEach(item => {
    //     console.log(item.title);
    //     console.log(item.link);
    //     console.log(item.pubDate);
    // });

    ctx.state.data = {
        title: 'Securonix Threat Labs',
        link: 'https://www.securonix.com/blog/?category%5B%5D=threat-research&keyword=#listing-section',
        item: itema,
    };
};
