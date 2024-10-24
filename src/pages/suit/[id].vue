<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import {
  BatchDownloadTask,
  GeneralSuitItem,
  SuitCardBGProperties,
  SuitCardProperties,
  SuitDetail,
  SuitEmojiPackageProperties,
  SuitLoadingProperties,
  SuitPlayIconProperties,
  SuitSkinProperties,
  SuitSpaceBGProperties,
  SuitThumbUpProperties
} from "../../types.ts";
import { sep } from "@tauri-apps/api/path";

const route = useRoute<'/suit/[id]'>()

const ids = ref<string[]>([])
const name = ref('')
const mid = ref('')

const cards = ref<GeneralSuitItem<SuitCardProperties>[]>([])
const cardBgs = ref<GeneralSuitItem<SuitCardBGProperties>[]>([])
const emojiPackages = ref<(GeneralSuitItem<SuitEmojiPackageProperties> & {
  items: {
    // [XXX_xxx]格式
    name: string
    properties: {
      image: string
    }
  }[]
})[]>([])
const loadings = ref<GeneralSuitItem<SuitLoadingProperties>[]>([])
const playIcons = ref<GeneralSuitItem<SuitPlayIconProperties>[]>([])
const skins = ref<GeneralSuitItem<SuitSkinProperties>[]>([])
const spaceBgs = ref<GeneralSuitItem<SuitSpaceBGProperties>[]>([])

// TODO 解析点赞动画的SVGA文件
const thumpUps = ref<GeneralSuitItem<SuitThumbUpProperties>[]>([])

const getSpaceBgImages = (spaceBgProp: Record<string, string>) => {
  const landscapes: string[] = []
  const portraits: string[] = []
  let index = 1
  while (true) {
    if (`image${index}_landscape` in spaceBgProp) {
      landscapes.push(spaceBgProp[`image${index}_landscape`])
      portraits.push(spaceBgProp[`image${index}_portrait`])
      index++
    } else {
      break
    }
  }
  return [landscapes, portraits]
}

const playIconProps = [
  ['drag_left_png', '进度条左滑'],
  ['drag_right_png', '进度条右滑'],
  ['middle_png', '进度条指示'],
  ['squared_image', '方形演示图'],
  ['static_icon_image', '图标'],
]

const skinProps = [
  ['head_bg'],
  // ['head_myself_mp4_bg'],
  ['head_myself_squared_bg'],
  ['head_tab_bg'],
  ['tail_bg'],
  ['tail_icon_channel'],
  ['tail_icon_dynamic'],
  ['tail_icon_main'],
  ['tail_icon_myself'],
  ['tail_icon_pub_btn_bg'],
  ['tail_icon_selected_channel'],
  ['tail_icon_selected_dynamic'],
  ['tail_icon_selected_main'],
  ['tail_icon_selected_myself'],
  ['tail_icon_selected_pub_btn_bg'],
  ['tail_icon_selected_shop'],
  ['tail_icon_shop'],
]

const generateDownloadTask = () => {
  let task: BatchDownloadTask = {
    name: name.value,
    files: [],
  }

  // 空间背景图
  spaceBgs.value.forEach(spaceBg => {
    const [landscapes, portraits] = getSpaceBgImages(spaceBg.properties)
    task.files.push(...landscapes.map((l, index) => {
      return {
        path: `${name.value}${sep()}${spaceBg.name}空间背景图${sep()}背景${index + 1}`,
        url: l,
      }
    }))
    task.files.push(...portraits.map((p, index) => {
      return {
        path: `${name.value}${sep()}${spaceBg.name}空间背景图${sep()}肖像${index + 1}`,
        url: p,
      }
    }))
  })

  // 表情包
  emojiPackages.value.forEach(emojiPackage => {
    const emojiInfo = emojiPackage.items
    task.files.push(...emojiInfo.map(emoji => {
      const emojiPackageName = emojiPackage.name.endsWith('表情包') ? emojiPackage.name : `${emojiPackage.name}表情包`
      const emojiName = emoji.name.split('_')[1]?.slice(0, -1) ?? emoji.name
      return {
        path: `${name.value}${sep()}${emojiPackageName}${sep()}${emojiName}`,
        url: emoji.properties.image,
      }
    }))
  })

  // 进度条
  playIcons.value.forEach(playIcon => {
    const playIconName = playIcon.name.endsWith('进度条') ? playIcon.name : `${playIcon.name}进度条`
    task.files.push(...playIconProps.map(([prop, desc]) => {
      return {
        path: `${name.value}${sep()}${playIconName}${sep()}${desc}`,
        url: playIcon.properties[prop as keyof typeof playIcon.properties] as string ?? '',
      }
    }))
  })

  // 皮肤
  skins.value.forEach(skin => {
    task.files.push(...skinProps.map(([prop, desc]) => {
      return {
        path: `${name.value}${sep()}${skin.name}皮肤${sep()}${desc ?? prop}`,
        url: skin.properties[prop as keyof typeof skin.properties] ?? '',
      }
    }))

    if (skin.properties.head_myself_mp4_bg) {
      task.files.push({
        path: `${name.value}${sep()}${skin.name}皮肤${sep()}head_myself_mp4_bg`,
        url: skin.properties.head_myself_mp4_bg,
      })
    }
  })


  // 粉丝牌背景
  cards.value.forEach(card => {
    task.files.push({
      path: `${name.value}${sep()}${card.name}粉丝牌`,
      url: card.properties.image,
    })
  })

  // 评论背景
  cardBgs.value.forEach(cardBg => {
    task.files.push({
      path: `${name.value}${sep()}${cardBg.name}评论背景`,
      url: cardBg.properties.image,
    })
  })

  // 加载动画
  loadings.value.forEach(loading => {
    task.files.push({
      path: `${name.value}${sep()}${loading.name}加载动画`,
      url: loading.properties.loading_url,
    })

    task.files.push({
      path: `${name.value}${sep()}${loading.name}加载动画(序列帧)`,
      url: loading.properties.loading_frame_url,
    })
  })

  task.files = task.files.flat()

  return task
}

const fetchData = async () => {
  ids.value = route.params.id.split(',')

  if (ids.value.length > 1) {
    // TODO 收藏集多部分装扮解析
    return
  }

  const url = new URL('https://api.bilibili.com/x/garb/v2/user/suit/benefit')
  url.searchParams.set('item_id', ids.value[0])
  url.searchParams.set('part', 'cards')

  let data: SuitDetail
  try {
    const resp = await APIFetch<SuitDetail>(url, undefined, {
      debug: {
        name: '装扮信息',
        extraParams: {
          item_id: '装扮ID',
        }
      }
    })
    data = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取装扮信息出错：${e}`,
      type: 'error',
    })
    return null
  }

  name.value = data.name
  mid.value = data.properties.fan_mid

  cards.value = data.suit_items.card ?? []
  cardBgs.value = data.suit_items.card_bg ?? []
  emojiPackages.value = data.suit_items.emoji_package as (GeneralSuitItem<SuitEmojiPackageProperties> & {
    items: {
      // [XXX_xxx]格式
      name: string
      properties: {
        image: string
      }
    }[]
  })[] ?? []
  loadings.value = data.suit_items.loading ?? []
  playIcons.value = data.suit_items.play_icon ?? []
  skins.value = data.suit_items.skin ?? []
  spaceBgs.value = data.suit_items.space_bg ?? []
  thumpUps.value = data.suit_items.thumbup ?? []
}

watch(() => route.params.id, fetchData, { immediate: true })

</script>

<template>
  <div>
    <ElDescriptions border>
      <template #title>
        装扮相关信息
      </template>
      <template #extra>
        <DebugButton :names="['装扮信息']" />
        <BatchDownloadButton :task="generateDownloadTask" />
      </template>

      <ElDescriptionsItem label="相关UP信息">
        <UPInfo :mid="mid" />
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 空间背景图 -->
    <template v-if="spaceBgs?.length ?? 0 > 0">
      <div
        v-for="spaceBg in spaceBgs"
        :key="spaceBg.item_id"
      >
        <ElDivider>空间背景图 - {{ spaceBg.name }}</ElDivider>
        <ElSpace
          class="w-full justify-center"
          wrap
        >
          <ImageVideoCard
            v-for="(image, index) in getSpaceBgImages(spaceBg.properties)[0]"
            :key="image"
            :title="`肖像${index + 1}`"
            :image="image"
            :download-name="`${name} - ${spaceBg.name} - 肖像${index + 1}`"
            :preview-images="getSpaceBgImages(spaceBg.properties)[0]"
            :index="index"
          />
        </ElSpace>
        <ElSpace
          class="w-full justify-center mt-4"
          wrap
        >
          <ImageVideoCard
            v-for="(image, index) in getSpaceBgImages(spaceBg.properties)[1]"
            :key="image"
            :title="`大图${index + 1}`"
            :image="image"
            :download-name="`${name} - ${spaceBg.name} - 大图${index + 1}`"
            :preview-images="getSpaceBgImages(spaceBg.properties)[1]"
            :index="index"
          />
        </ElSpace>
      </div>
    </template>

    <!-- 表情包 -->
    <template v-if="emojiPackages?.length ?? 0 > 0">
      <div
        v-for="emojiInfo in emojiPackages"
        :key="emojiInfo.item_id"
      >
        <ElDivider>表情包 - {{ emojiInfo.name }}</ElDivider>
        <ElSpace
          class="w-full justify-center"
          wrap
        >
          <ImageVideoCard
            v-for="(emoji, index) in emojiInfo.items"
            :key="emoji.name"
            :title="emoji.name.split('_')[1].slice(0, -1) ?? emoji.name"
            :image="emoji.properties.image"
            :download-name="`${name} - ${emojiInfo.name} - ${emoji.name.split('_')[1].slice(0, -1) ?? emoji.name}`"
            :preview-images="emojiInfo.items.map(e => e.properties.image)"
            :index="index"
          />
        </ElSpace>
      </div>
    </template>

    <!-- 进度条 -->
    <template v-if="playIcons?.length ?? 0 > 0">
      <ElDivider>进度条 - {{ playIcons[0].name }}</ElDivider>
      <div
        v-for="icon in playIcons"
        :key="icon.item_id"
      >
        <ElSpace
          class="w-full justify-center"
          wrap
        >
          <ImageVideoCard
            v-for="[prop, desc] in playIconProps"
            :key="prop"
            :title="desc"
            :image="icon.properties[prop]"
            :download-name="`${name} - ${icon.name} - ${desc}`"
          />
        </ElSpace>
      </div>
    </template>

    <!-- 皮肤 -->
    <template v-if="skins?.length ?? 0 > 0">
      <div
        v-for="skin in skins"
        :key="skin.item_id"
      >
        <ElDivider>皮肤 - {{ skin.name }}</ElDivider>
        <ElSpace
          class="w-full justify-center"
          wrap
        >
          <ImageVideoCard
            v-for="([prop, desc], index) in skinProps.filter(([p]) => (skin.properties[p]?.length ?? 0) > 0)"
            :key="prop"
            :title="desc ?? prop"
            :image="skin.properties[prop]"
            :download-name="`${name} - ${skin.name} - ${desc ?? prop}`"
            :preview-images="skinProps.filter(([p]) => (skin.properties[p]?.length ?? 0) > 0).map(p => skin.properties[p])"
            :index="index"
          />
        </ElSpace>
      </div>
    </template>

    <!-- 杂项 -->
    <template v-if="cardBgs?.length ?? 0 > 0">
      <ElDivider>杂项</ElDivider>
      <ElSpace
        class="w-full justify-center"
        wrap
      >
        <!-- 粉丝牌背景 -->
        <ImageVideoCard
          v-for="card in cards"
          :key="card.item_id"
          :title="card.name + '粉丝牌'"
          :image="card.properties.image"
          :download-name="`${name} - ${card.name}粉丝牌`"
        />

        <!-- 评论背景 -->
        <ImageVideoCard
          v-for="card in cardBgs"
          :key="card.item_id"
          :title="card.name + '评论背景'"
          :image="card.properties.image"
          :download-name="`${name} - ${card.name}评论背景`"
        />

        <!-- 加载动画 -->
        <ImageVideoCard
          v-for="loading in loadings"
          :key="loading.item_id"
          :title="loading.name + '加载动画'"
          :image="loading.properties.loading_url"
          :download-name="`${name} - ${loading.name}加载动画`"
        />
        <ImageVideoCard
          v-for="loading in loadings"
          :key="loading.item_id"
          :title="loading.name + '加载动画(序列帧)'"
          :image="loading.properties.loading_frame_url"
          :download-name="`${name} - ${loading.name}加载动画(序列帧)`"
        />
      </ElSpace>
    </template>
  </div>
</template>
