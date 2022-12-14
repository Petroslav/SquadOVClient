<template>
    <div>
        <router-link :to="to" :event="disableClick ? '' : 'click'">
            <v-sheet
                :class="`task-summary ${fill ? 'full-parent-height' : ''}`"
                rounded
            >
                <v-row no-gutters :class="`task-summary ${fill ? 'full-parent-height' : ''}`">
                    <v-col cols="2" align-self="center">
                        <v-img
                            class="mx-4"
                            :src="$root.generateAssetUri(content.getTaskIcon(task.taskName))"
                            max-width="100"
                            max-height="100"
                            contain
                        >
                        </v-img>
                    </v-col>

                    <v-col cols="4" align-self="center">
                        <span class="mr-4 text-h6">{{ timeStr }}</span>
                    </v-col>

                    <v-col cols="4" align-self="center">
                        <span class="text-h5">
                            {{ content.getTaskName(task.taskName) }}
                        </span>

                        <span class="text-subtitle">
                            {{ content.getTaskMode(task.taskName, task.mode) }}
                        </span>
                    </v-col>

                    <v-spacer></v-spacer>

                    <v-col cols="2" align-self="center">
                        <span class="text-h6">{{ task.score }}</span>
                    </v-col>
                </v-row>

                <div class="vod-div" v-if="hasVod">
                    <v-icon color="black">
                        mdi-video
                    </v-icon>
                </div>
            </v-sheet>
        </router-link>
    </div>
</template>

<script lang="ts">

import Component, {mixins} from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { AimlabTaskData } from '@client/js/aimlab/aimlab_task'
import { AimlabContent, getAimlabContent } from '@client/js/aimlab/aimlab_content'
import { standardFormatTime } from '@client/js/time'
import { VodAssociation } from '@client/js/squadov/vod'
import { apiClient, ApiData } from '@client/js/api'
import * as pi from '@client/js/pages'
import CommonComponent from '@client/vue/CommonComponent'

@Component
export default class AimlabTaskSummaryDisplay extends mixins(CommonComponent) {
    @Prop({ required : true })
    task! : AimlabTaskData

    @Prop({required: true})
    userId!: number

    @Prop({type: Boolean, default: false})
    fill!: boolean

    @Prop()
    syncVod! : VodAssociation | null
    vod: VodAssociation | null = null

    @Prop({type: Boolean, default: false})
    disableClick!: boolean

    @Prop()
    accessToken!: string | undefined

    content : AimlabContent = getAimlabContent()

    get hasVod() : boolean {
        return !!this.vod
    }

    get to() : any {
        return {
            name: pi.AimlabMatchPageId,
            params: {
                taskId: this.task.matchUuid
            },
            query: {
                userId: this.userId,
                at: this.accessToken,
            }
        }
    }

    get timeStr() : string {
        return standardFormatTime(this.task.createDate)
    }

    @Watch('task', {deep: true})
    @Watch('isActive')
    refreshVod() {
        if (!this.isActive) {
            return
        }

        this.vod = null
        apiClient.accessToken(this.accessToken).findVodFromMatchUserId(this.task.matchUuid, this.userId).then((resp : ApiData<VodAssociation>) => {
            this.vod = resp.data
        }).catch((err : any) => {
            this.vod = null
        }).finally(() => {
            this.$emit('update:syncVod', this.vod)
        })
    }

    mounted () {
        this.refreshVod()
    }
}

</script>

<style scoped>

.task-summary {
    width: 100%;
    position: relative;
    overflow: hidden;
}

.task-div {
    min-height: 125px;
}


</style>