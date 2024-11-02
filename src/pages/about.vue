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
  <div class="flex flex-col w-full h-full p-12">
    <div class="max-w-screen-lg overflow-hidden flex flex-col bg-gray-100 rounded-lg p-8">
      <span class="text-xl">BiliResourceDownloader</span>
      <span class="text-sm">版本 0.9.0</span>
      <ElDivider />
      <span>多功能资源下载工具</span>
      <span>本软件开源免费，基于MIT协议进行开源</span>
      <br>
      <div
        v-for="related in relatedLinks"
        :key="related.name"
        class="flex mb-2"
      >
        <div class="w-24 shrink-0">
          {{ related.name }}：
        </div>
        <div class="flex flex-wrap justify-start overflow-hidden">
          <ElLink
            v-for="link in related.links"
            :key="link.link"
            :href="link.link"
            type="primary"
            target="_blank"
            class="mr-4 text-ellipsis"
          >
            {{ link.name }}
          </ElLink>
        </div>
      </div>
    </div>
  </div>
</template>
