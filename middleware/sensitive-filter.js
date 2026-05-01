// 敏感词过滤中间件
const SENSITIVE_WORDS = [
  '傻逼', '白痴', '脑残', '神经病', '操你妈', '滚', '死',
  '杀', '毒品', '赌博', '色情', '枪支', '发票', '代开',
  '兼职', '刷单', '贷款', '信用卡', '办证', '迷药', '催情',
  '裸聊', '黄色', '反共', '藏独', '台独', '疆独', '港独',
  '轮子', '邪教', '暴乱', '自焚', '自杀', '强奸', '迷奸',
  '微信群', 'QQ群', '加群', '联系我', '电话联系'
];

class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class SensitiveFilter {
  constructor(words) {
    this.root = new TrieNode();
    for (const word of words) {
      this.insert(word);
    }
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  hasSensitiveWord(text) {
    if (!text) return false;
    let i = 0;
    while (i < text.length) {
      let node = this.root;
      let j = i;
      while (j < text.length && node.children[text[j]]) {
        node = node.children[text[j]];
        if (node.isEnd) return true;
        j++;
      }
      i++;
    }
    return false;
  }

  filter(text) {
    if (!text) return text;
    let result = '';
    let i = 0;
    
    while (i < text.length) {
      let node = this.root;
      let j = i;
      let found = false;
      let matchLength = 0;
      
      while (j < text.length && node.children[text[j]]) {
        node = node.children[text[j]];
        j++;
        if (node.isEnd) {
          found = true;
          matchLength = j - i;
        }
      }
      
      if (found) {
        result += '*'.repeat(matchLength);
        i += matchLength;
      } else {
        result += text[i];
        i++;
      }
    }
    return result;
  }
}

const filterSystem = new SensitiveFilter(SENSITIVE_WORDS);

module.exports = filterSystem;
