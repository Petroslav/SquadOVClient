<template>
    <v-btn
        small
        icon
        @click="open"
    >
        <v-icon>
            mdi-facebook
        </v-icon>
    </v-btn>
</template>

<script lang="ts">

import Component, { mixins } from 'vue-class-component'
import GenericExternalShareButton from '@client/vue/utility/squadov/share/GenericExternalShareButton'
import CommonComponent from '@client/vue/CommonComponent'
import { openUrlInBrowser } from '@client/js/external'

@Component
export default class FacebookShareButton extends mixins(CommonComponent, GenericExternalShareButton) {
    get fbUrl(): string {
        return `https://www.facebook.com/dialog/share?app_id=634563677473295&display=popup&href=${encodeURI(this.url)}&=redirect_uri=${encodeURI('https://squadov.gg')}`
    }

    open() {
        this.sendAnalyticsEvent(this.AnalyticsCategory.Share, this.AnalyticsAction.ShareSocialMedia, 'Facebook', 0)
        openUrlInBrowser(this.fbUrl)
    }
}

</script>