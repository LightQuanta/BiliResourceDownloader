interface Wbi {
  img_url: string
  sub_url: string
  w_webid: string
}

interface WbiStore extends Wbi {
  last_update: number
}