<template>
    <div class="d-flex flex-column justify-center align-center full-parent-height full-width">
        <loading-container :is-loading="!squad || !inviter">
            <template v-slot:default="{ loading }">
                <div class="d-flex flex-column justify-center align-center full-parent-height inner-content" v-if="!loading">
                    <template v-if="!success">
                        <div class="text-h6">
                            You were invited to join the squad <span class="font-weight-bold">{{ squad.squadName }}</span> by <span class="font-weight-bold">{{ inviter.username }}</span>.
                        </div>

                        <v-btn
                            color="success"
                            class="mt-2"
                            @click="joinSquad"
                            :loading="joining"
                        >
                            Join the Squad
                        </v-btn>

                        <router-link
                            :to="homeTo"
                            class="text-caption mt-1"
                        >
                            No, thanks.
                        </router-link>
                    </template>

                    <template v-else>
                        <div class="text-h6">
                            You've joined <span class="font-weight-bold">{{ squad.squadName }}</span>!
                        </div>

                        <div class="text-subtitle-2 mt-1">
                            You will be redirected to the home page in {{ timeToRedirect }} seconds...
                        </div>
                    </template>
                </div>
            </template>
        </loading-container>

        <v-snackbar
            v-model="error"
            :timeout="5000"
            color="error"
        >
            Failed to join the squad. You may be using an expired invite link or the squad may be full. Double check and try again.
        </v-snackbar>
    </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import { Prop, Watch } from 'vue-property-decorator'
import { apiClient, ApiData } from '@client/js/api'
import { Squad, SquadInviteLinkData } from '@client/js/squadov/squad'
import { SquadOVUserHandle } from '@client/js/squadov/user'
import { DashboardPageId, LoginPageId } from '@client/js/pages'

@Component({
    components: {
        LoadingContainer
    }
})
export default class SquadLinkResponsePage extends Vue {
    @Prop({required: true})
    linkId!: string

    success: boolean = false
    squad: Squad | null = null
    inviter: SquadOVUserHandle | null = null
    error: boolean = false
    joining: boolean = false
    timeToRedirect: number = 5

    get homeTo(): any {
        return {
            name: DashboardPageId
        }
    }

    redirectTick() {
        this.timeToRedirect -= 1
        if (this.timeToRedirect <= 0) {
            this.$router.push(this.homeTo)
        } else {
            this.startRedirectTick()
        }
    }

    startRedirectTick() {
        setTimeout(() => {
            this.redirectTick()
        }, 1000)
    }

    joinSquad() {
        if (!this.$store.state.currentUser) {
            return
        }

        this.joining = true
        apiClient.acceptSquadInviteLink(this.linkId).then(() => {
            this.success = true
            this.startRedirectTick()
        }).catch((err: any) => {
            console.error('Failed to accept squad invite: ', err)
            this.error = true
        }).finally(() => {
            this.joining = false
        })
    }
    
    @Watch('linkId')
    getInfoFromSquadInviteLink() {
        apiClient.getSquadInviteLinkData(this.linkId).then((resp: ApiData<SquadInviteLinkData>) => {
            if (!!this.$store.state.currentUser) {
                this.squad = resp.data.squad
                this.inviter = resp.data.inviter
            } else {
                // Redirect to login with the referral link
                this.$router.replace({
                    name: LoginPageId,
                    query: {
                        ref: resp.data.referral,
                        redirect: this.$router.currentRoute.fullPath,
                    }
                })
            }
        }).catch((err: any) => {
            console.error('Failed to get link data: ', err)
        })
    }

    mounted() {
        this.getInfoFromSquadInviteLink()
    }

    activated() {
        this.getInfoFromSquadInviteLink()
    }
}

</script>

<style scoped>

.inner-content {
    width: 50%;
}

</style>