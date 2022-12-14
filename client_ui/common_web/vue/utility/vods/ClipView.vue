<template>
    <loading-container :is-loading="!clip">
        <template v-slot:default="{ loading }">
            <div v-if="!loading">
                <video-player
                    class="mb-1 clip-vod"
                    fill
                    disable-theater
                    disable-popout
                    :vod="clip.clip"
                    :current-time.sync="viewTime"
                    :ready.sync="vodReady"
                    :current-ts.sync="timestamp"
                    :clip-uuid="clipUuid"
                    :permissions="permissions"
                    :full-path="$route.fullPath"
                    :timestamp="timestamp"
                    no-clip
                >
                </video-player>

                <div class="px-4 mt-1">
                    <div class="d-flex align-center">
                        <v-img
                            class="mr-1"
                            width="32px"
                            max-width="32px"
                            height="32px"
                            max-height="32px"
                            contain
                            :src="$root.generateAssetUri(gameToIcon(clip.game))"
                        >
                        </v-img>
                        <div class="font-weight-bold text-h6 mr-2">{{ clip.title }}</div>
                        <v-icon
                            class="mr-1"
                        >
                            mdi-eye
                        </v-icon>
                        <div class="text-body-2 mr-4">{{ clip.views }}</div>

                        <vod-download-button
                            v-if="!!clip"
                            :video-uuid="clip.clip.videoUuid"
                            :track="clip.manifest.videoTracks[0]"
                        >
                        </vod-download-button>

                        <vod-delete-button
                            v-if="!!clip && isClipOwner"
                            :vod="clip.clip"
                            @on-delete="onDeleteFinish"
                        >
                        </vod-delete-button>
                          
                        <v-spacer></v-spacer>

                        <div v-if="!!myReacts" @click="toggleLike" :class="`${isUser ? 'like-button' : ''}`">
                            <template v-if="!reactPending">
                                <div class="d-flex align-center">
                                    <v-icon
                                        class="mr-1"
                                        :color="`${hasReact ? 'success' : undefined}`"
                                    >
                                        mdi-thumb-up
                                    </v-icon>
                                    <div class="text-body-2 mr-4">{{ clip.reacts }}</div>
                                </div>
                            </template>

                            <template v-else>
                                <v-progress-circular indeterminate size="16"></v-progress-circular>
                            </template>
                        </div>

                        <template v-if="isUser">
                            <vod-favorite-button
                                class="mr-1"
                                :vod-uuid="clipUuid"
                            >
                            </vod-favorite-button>

                            <vod-watchlist-button
                                :vod-uuid="clipUuid"
                                class="mr-1"
                            >
                            </vod-watchlist-button>
                        </template>

                        <template v-if="!!clip && isClipOwner">
                            <v-dialog v-model="showHideEdit" persistent max-width="80%">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn
                                        icon
                                        color="success"
                                        class="mr-1"
                                        v-bind="attrs"
                                        v-on="on"
                                    >
                                        <v-icon>
                                            mdi-pencil
                                        </v-icon>
                                    </v-btn>
                                </template>

                                <v-card>
                                    <v-card-title>
                                        Edit Clip
                                    </v-card-title>
                                    <v-divider></v-divider>

                                    <v-form v-model="editValid">
                                        <v-text-field
                                            v-model="editTitle"
                                            label="Title"
                                            filled
                                            :rules="titleRules"
                                        >
                                        </v-text-field>

                                        <v-textarea
                                            filled
                                            label="Description"
                                            v-model="editDescription"
                                            hide-details
                                        >
                                        </v-textarea>
                                    </v-form>

                                    <v-card-actions>
                                        <v-btn
                                            color="error"
                                            @click="showHideEdit = false"
                                        >
                                            Cancel
                                        </v-btn>

                                        <v-spacer></v-spacer>

                                        <v-btn
                                            color="success"
                                            :disabled="!editValid"
                                            @click="doClipEdit"
                                            :loading="publishInProgress"
                                        >
                                            Save
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>
                            <v-btn
                                v-if="!clip.published"
                                color="primary"
                                class="mr-1"
                                @click="doPublish"
                                :loading="publishInProgress"
                            >
                                Publish
                            </v-btn>
                        </template>

                        <match-share-button
                            v-if="!!clip && hasFastify"
                            :clip-uuid="clipUuid"
                            :permissions="permissions"
                            :full-path="$route.fullPath"
                            :timestamp="timestamp"
                            no-clip
                        >
                        </match-share-button>

                        <div class="d-flex align-center" v-else>
                            <div class="text-subtitle-2 font-weight-bold">
                                Clip Processing...
                            </div>

                            <v-tooltip bottom :open-delay="100">
                                <template v-slot:activator="{on, attrs}">
                                    <div
                                        v-on="on"
                                        v-bind="attrs"
                                    >
                                        <v-progress-circular
                                            indeterminate size="16"
                                        >
                                        </v-progress-circular>
                                    </div>
                                </template>

                                This video is still being processed. You'll be able to share as soon as it's done!
                            </v-tooltip>
                        </div>
                    </div>

                    <bulk-tag-display
                        :video-uuid="clip.clip.videoUuid"
                        :tags="clip.tags"
                        :max-tags="20"
                    >
                    </bulk-tag-display>

                    <div class="d-flex align-center">
                        <div class="text-body-2">{{ clipTime }}</div><span class="mx-1">&#183;</span>
                        <div class="text-body-2 font-weight-bold">
                            <template v-if="!!vodProfileHandle">
                                <router-link :to="vodProfileTo">{{ clip.clipper }}</router-link>
                            </template>

                            <template v-else>
                                {{ clip.clipper }}
                            </template>
                        </div>
                    </div>
                    
                    <div class="long-text text-body-2">{{ clip.description }}</div>
                    <v-divider class="my-2"></v-divider>

                    <template v-if="isUser">
                        <div class="d-flex align-center">
                            <div class="text-h6 font-weight-bold">Comments</div>
                             <v-icon
                                class="mr-1"
                            >
                                mdi-comment
                            </v-icon>
                            <div class="text-body-2">{{ clip.comments }}</div>
                        </div>
                        <loading-container :is-loading="!comments">
                            <template v-slot:default="{ loading }">
                                <div v-if="!loading">
                                    <v-text-field
                                        v-model="commentText"
                                        class="mt-2"
                                        solo
                                        single-line
                                        hide-details
                                        label="Comment"
                                    >
                                    </v-text-field>

                                    <div class="d-flex mt-2" v-if="hasValidComment">
                                        <v-spacer></v-spacer>
                                        <v-btn
                                            class="mr-4"
                                            color="error"
                                            @click="commentText = ''"
                                        >
                                            Cancel
                                        </v-btn>
                                        <v-btn
                                            color="primary"
                                            @click="submitComment"
                                            :disabled="!hasValidComment"
                                            :loading="commentPending"
                                        >
                                            Comment
                                        </v-btn>
                                    </div>

                                    <v-list class="mt-2" dense two-line>
                                        <v-list-item v-for="(comment, idx) in comments" :key="idx">
                                            <v-list-item-content>
                                                <v-list-item-title>
                                                    <span class="font-weight-bold">{{ comment.username }}</span>
                                                    <span class="mx-1">&#183;</span>
                                                    <span>{{ standardFormatTime(comment.tm) }}</span>
                                                </v-list-item-title>

                                                <v-list-item-subtitle>
                                                    {{ comment.comment }}
                                                </v-list-item-subtitle>
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list>

                                    <v-btn
                                        color="primary"
                                        @click="loadMoreComments"
                                        block
                                        v-if="hasMoreComments"
                                    >
                                        Load More Comments
                                    </v-btn>
                                </div>
                            </template>
                        </loading-container>
                    </template>

                    <div v-else>
                        <div class="d-flex justify-center text-h6 font-weight-bold">
                            You must be a registered user to comment and react to clips.
                        </div>

                        <div class="d-flex justify-center">
                            <v-btn
                                class="mx-1"
                                color="success"
                                :to="registerTo"
                            >
                                Register
                            </v-btn>

                            <v-btn
                                class="mx-1"
                                color="primary"
                                :to="loginTo"
                            >
                                Login
                            </v-btn>
                        </div>
                    </div>
                </div>

                <v-snackbar
                    v-model="commentError"
                    :timeout="5000"
                    color="error"
                >
                    Failed to comment. Please try again.
                </v-snackbar>
            </div>
        </template>
    </loading-container>
</template>

<script lang="ts">

import Component, {mixins} from 'vue-class-component'
import CommonComponent from '@client/vue/CommonComponent'
import { Prop, Watch } from 'vue-property-decorator'
import { VodClip, ClipReact, ClipComment } from '@client/js/squadov/vod'
import { apiClient, HalResponse, ApiData } from '@client/js/api'
import { standardFormatTime } from '@client/js/time'
import { gameToIcon } from '@client/js/squadov/game'
import { MatchVideoSharePermissions } from '@client/js/squadov/share'
import * as pi from '@client/js/pages'

import VideoPlayer from '@client/vue/utility/VideoPlayer.vue'
import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import MatchShareButton from '@client/vue/utility/squadov/MatchShareButton.vue'
import VodFavoriteButton from '@client/vue/utility/vods/VodFavoriteButton.vue'
import VodWatchlistButton from '@client/vue/utility/vods/VodWatchlistButton.vue'
import VodDownloadButton from '@client/vue/utility/vods/VodDownloadButton.vue'
import VodDeleteButton from '@client/vue/utility/vods/VodDeleteButton.vue'
import BulkTagDisplay from '@client/vue/utility/vods/BulkTagDisplay.vue'
import { UserProfileHandle } from '@client/js/squadov/user'

const maxCommentsPerRequest = 20

@Component({
    components: {
        VideoPlayer,
        LoadingContainer,
        MatchShareButton,
        VodFavoriteButton,
        VodWatchlistButton,
        VodDownloadButton,
        VodDeleteButton,
        BulkTagDisplay,
    }
})
export default class ClipView extends mixins(CommonComponent) {
    standardFormatTime = standardFormatTime

    @Prop({required: true})
    clipUuid!: string

    @Prop({default: 0})
    inTs!: number

    clip: VodClip | null = null
    myReacts: ClipReact[] | null = null
    viewTime: Date | null = null
    vodReady: boolean = false
    onVodShowTime: Date | null = null
    timestamp: number = 0
    hasFastify: boolean = false

    // Comments
    comments: ClipComment[] | null = null
    lastCommentIndex: number = 0
    nextCommentLink: string | null = null

    gameToIcon = gameToIcon
    reactPending: boolean = false
    sentView: boolean = false

    commentText: string = ''
    commentPending: boolean = false
    commentError: boolean = false

    permissions: MatchVideoSharePermissions | null = null
    vodProfileHandle: UserProfileHandle | null = null

    showHideEdit: boolean = false
    editValid: boolean = false
    editInProgress: boolean = false
    editTitle: string = ''
    editDescription: string = ''
    publishInProgress: boolean = false
    publishError: boolean = false

    doPublish() {
        this.publishInProgress = true
        apiClient.publishClip(this.clipUuid, null, null).then(() => {
            if (!!this.clip) {
                this.clip.published = true
            }
        }).catch((err: any) => {
            console.error('Failed to publish clip: ', err)
            this.publishError = true
        }).finally(() => {
            this.publishInProgress = false
        })
    }

    doClipEdit() {
        this.publishInProgress = true
        apiClient.publishClip(this.clipUuid, this.editTitle, this.editDescription).then(() => {
            if (!!this.clip) {
                this.clip.published = true
                this.clip.title = this.editTitle
                this.clip.description = this.editDescription
            }
            this.showHideEdit = false
        }).catch((err: any) => {
            console.error('Failed to edit clip: ', err)
            this.publishError = true
        }).finally(() => {
            this.publishInProgress = false
        })
    }

    get titleRules() : any[] {
        return [
            (value : any) => (!!value && value.length > 0) || 'Required.',
        ]
    }

    get isClipOwner(): boolean {
        return !!this.$store.state.currentUser &&
            !!this.clip &&
            this.$store.state.currentUser.uuid === this.clip.clip.userUuid
    }

    get vodProfileTo(): any {
        return {
            name: pi.UserProfileSlugPageId,
            params: {
                profileSlug: this.vodProfileHandle?.slug
            }
        }
    }

    @Watch('clipUuid')
    refreshProfileInformation() {
        this.vodProfileHandle = null

        apiClient.getUserProfileHandleFromVideoUuid(this.clipUuid).then((resp: ApiData<UserProfileHandle>) => {
            this.vodProfileHandle = resp.data
        }).catch((err: any) => {
            console.warn('Failed to get user profile handle from clip: ', err)
        })
    }

    @Watch('clipUuid')
    refreshPermissions() {
        this.permissions = null
        apiClient.getGenericSharePermissions(undefined, this.clipUuid, undefined).then((resp: ApiData<MatchVideoSharePermissions>) => {
            this.permissions = resp.data
        }).catch((err: any) => {
            console.error('Failed to get clip share permissions: ', err)
        })
    }

    get hasValidComment(): boolean {
        return this.commentText.length > 0
    }

    @Watch('viewTime')
    updateViewTime() {
        if (!this.clip || !this.viewTime || this.sentView || !this.onVodShowTime) {
            return
        }

        let elapsed = this.viewTime.getTime() - this.clip.clip.startTime.getTime()
        let threshold = (this.clip.clip.endTime.getTime() - this.clip.clip.startTime.getTime()) * 0.5
        // Check that we actually viewed for this amount of time so the user can't just skip ahead and get a view.
        let vodOnPage = new Date().getTime() - this.onVodShowTime.getTime()

        if (elapsed >= threshold && vodOnPage >= threshold) {
            this.sentView = true
            apiClient.accessToken().markClipView(this.clipUuid).catch((err: any) => {
                console.error('Failed to mark clip view: ', err)
                this.sentView = false
            })
        }
    }

    @Watch('vodReady')
    onVodReady() {
        if (!this.vodReady) {
            return
        }
        this.onVodShowTime = new Date()
    }

    get isUser(): boolean {
        return !!this.$store.state.currentUser
    }

    get isOwner(): boolean {
        return this.isUser && !!this.clip && this.$store.state.currentUser.uuid === this.clip.clip.userUuid
    }

    get hasReact(): boolean {
        if (!this.myReacts) {
            return false
        }
        return this.myReacts.length > 0
    }

    toggleLike() {
        if (!this.isUser || this.reactPending) {
            return
        }

        this.reactPending = true

        let promise
        let add = !this.hasReact
        if (this.hasReact) {
            promise = apiClient.removeReactToClip(this.clipUuid)
        } else {
            promise = apiClient.reactToClip(this.clipUuid)
        }

        promise.then(() => {
            if (add) {
                this.myReacts!.push({})
                this.clip!.reacts += 1
            } else {
                this.myReacts!.pop()
                this.clip!.reacts -= 1
            }
        }).catch((err: any) => {
            console.error('Failed to react to clip: ', err)
        }).finally(() => {
            this.reactPending = false
        })
    }

    get clipTime(): string {
        if (!this.clip) {
            return ''
        }
        return standardFormatTime(this.clip.tm)
    }

    get hasMoreComments(): boolean {
        return !!this.nextCommentLink
    }

    recheckClipFastify() {
        apiClient.getVodFastifyStatus(this.clipUuid).then((resp: ApiData<boolean>) => {
            this.hasFastify = resp.data
        }).catch((err: any) => {
            console.log('Failed to get VOD fastify status: ', err)
        }).finally(() => {
            if (!this.hasFastify && this.isActive) {
                this.startRecheckClipFastify()
            }
        })
    }

    @Watch('isActive')
    onActiveChange() {
        if (!this.hasFastify) {
            this.recheckClipFastify()
        }
    }

    startRecheckClipFastify() {
        setTimeout(() => {
            this.recheckClipFastify()
        }, 1000 + Math.random() * 500)
    }

    @Watch('clipUuid')
    @Watch('isActive')
    refreshData() {
        this.recheckClipFastify()

        apiClient.accessToken().getClip(this.clipUuid).then((resp: ApiData<VodClip>) => {
            this.clip = resp.data
        }).catch((err: any) => {
            console.error('Failed to load clip: ', err)
        })

        if (this.isUser) {
            apiClient.getClipReacts(this.clipUuid).then((resp: ApiData<ClipReact[]>) => {
                this.myReacts = resp.data
            }).catch((err: any) => {
                console.error('Failed to get clip reacts: ', err)
            })
        } else {
            this.myReacts = []
        }

        this.lastCommentIndex = 0
        this.nextCommentLink = null
        this.loadMoreComments()
    }

    loadMoreComments() {
        if (!this.isUser) {
            this.comments = []
            return
        }
        apiClient.accessToken().getClipComments({
            next: this.nextCommentLink,
            clipUuid: this.clipUuid,
            start: this.lastCommentIndex,
            end: this.lastCommentIndex + maxCommentsPerRequest
        }).then((resp: ApiData<HalResponse<ClipComment[]>>) => {
            if (!this.comments) {
                this.comments = resp.data.data
            } else {
                this.comments.push(...resp.data.data)
            }
            this.lastCommentIndex += resp.data.data.length
            if ("next" in resp.data._links) {
                this.nextCommentLink = resp.data._links["next"].href
            } else {
                this.nextCommentLink = null
            }
        }).catch((err: any) => {
            console.error('Failed to get comments: ', err)
        })
    }

    submitComment() {
        if (!this.hasValidComment) {
            return
        }

        this.commentPending = true
        apiClient.addNewClipComment(this.clipUuid, this.commentText).then((resp: ApiData<ClipComment>) => {
            this.comments!.unshift(resp.data)
            this.clip!.comments += 1
            this.commentText = ''
        }).catch((err: any) => {
            console.error('Failed to add new comment: ', err)
            this.commentError = true
        }).finally(() => {
            this.commentPending = false
        })
    }

    mounted() {
        if (!isNaN(this.inTs)) {
            this.timestamp = this.inTs
        }

        this.refreshData()
        this.refreshPermissions()
        this.refreshProfileInformation()
    }

    onDeleteFinish() {
        // Once we've deleted the clip we can just go back to the clip library since there won't be
        // anything else to do on this page.
        this.$router.replace({
            name: pi.ClipLibraryPageId,
            query: {
                refresh: '1',
            }
        })
    }

    get registerTo(): any {
        return {
            name: pi.RegisterPageId
        }
    }

    get loginTo(): any {
        return {
            name: pi.LoginPageId
        }
    }
}

</script>

<style scoped>

.clip-vod {
    width: 100%;
    height: 60vh;
}

.like-button {
    cursor: pointer;
}

</style>