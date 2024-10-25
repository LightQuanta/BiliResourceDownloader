<script setup lang="ts">
interface RelatedLink {
  name: string
  links: {
    name: string
    link: string
  }[]
}

const relatedLinks: RelatedLink[] = [
  {
    name: '项目地址',
    links: [
      {
        name: 'BiliResourceDownloader(GitHub)',
        link: 'https://github.com/LightQuanta/BiliResourceDownloader',
      }, {
        name: 'BiliResourceDownloader(Gitee)',
        link: 'https://gitee.com/Light_Quanta/BiliResourceDownloader',
      },
    ],
  }, {
    name: '作者',
    links: [
      {
        name: 'GitHub: LightQuanta',
        link: 'https://github.com/LightQuanta',
      },
      {
        name: 'Bilibili: LightQuanta',
        link: 'https://space.bilibili.com/80950664',
      },
      {
        name: 'GitHub: QingXia-Ela',
        link: 'https://github.com/QingXia-Ela',
      },
      {
        name: 'Bilibili: 青夏家的Ela',
        link: 'https://space.bilibili.com/86894342',
      },
    ]
  }
]
</script>

<template>
  <div class="flex flex-col w-full h-full p-16">
    <span class="text-xl">BiliResourceDownloader</span>
    <span class="text-sm">版本 0.1.0</span>
    <br>
    <span>多功能资源下载工具</span>
    <span>本软件开源免费，基于MIT协议进行开源</span>
    <br>
    <span
      v-for="related in relatedLinks"
      :key="related.name"
    >
      <span>{{ related.name }}：</span>
      <ElLink
        v-for="link in related.links"
        :key="link.link"
        :href="link.link"
        type="primary"
        target="_blank"
        class="mr-2"
      >
        {{ link.name }}
      </ElLink>
    </span>
  </div>
</template>
