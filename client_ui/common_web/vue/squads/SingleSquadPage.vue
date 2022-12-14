<template>
    <loading-container :is-loading="!localMembership">
        <template v-slot:default="{ loading }">
            <v-container fluid v-if="!loading">
                <div class="d-flex align-center">
                    <div class="d-flex flex-column">
                        <div v-if="!editMode" class="text-h5 font-weight-bold">{{ localMembership.squad.squadName }}</div>
                        <v-text-field
                            v-model="editSquadName"
                            filled
                            dense
                            hide-details
                            v-else
                        >
                        </v-text-field>
                    </div>

                    <template v-if="isOwner">
                        <v-btn icon color="warning" v-if="!editMode" @click="startEdit">
                            <v-icon>
                                mdi-pencil
                            </v-icon>
                        </v-btn>

                        <template v-else>
                            <v-btn icon color="error" @click="cancelEdit" :loading="editPending">
                                <v-icon>
                                    mdi-close
                                </v-icon>
                            </v-btn>

                            <v-btn icon color="success" @click="saveEdit" :disabled="editSquadName.trim() == ''" :loading="editPending">
                                <v-icon>
                                    mdi-content-save
                                </v-icon>
                            </v-btn>
                        </template>
                    </template>
                    
                    <v-spacer></v-spacer>

                    <v-dialog v-model="showHideDeleteLeave" persistent width="40%">
                        <template v-slot:activator="{on, attrs}">
                            <v-btn icon color="error"  v-bind="attrs" v-on="on">
                                <v-icon v-if="isOwner">
                                    mdi-delete
                                </v-icon>

                                <v-icon v-else>
                                    mdi-exit-to-app
                                </v-icon>
                            </v-btn>
                        </template>

                        <v-card>
                            <v-card-title>
                                {{ leaveDeleteAction }}&nbsp;{{ localMembership.squad.squadName }}
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-card-text class="mt-4">
                                <div>
                                    Are you sure you wish to {{ leaveDeleteAction.toLowerCase() }} {{ localMembership.squad.squadName }}?
                                </div>

                                <div class="mt-4">
                                    Please type <span class="font-weight-bold">{{ localMembership.squad.squadName }}</span> to confirm this action.
                                </div>

                                <v-text-field
                                    class="mt-4"
                                    filled
                                    label="Confirmation"
                                    v-model="confirmationText"
                                    hide-details
                                >
                                </v-text-field>
                            </v-card-text>

                            <v-card-actions>
                                <v-btn @click="cancelDeleteLeave">
                                    Cancel
                                </v-btn>

                                <v-spacer></v-spacer>

                                <v-btn
                                    color="error"
                                    :loading="leaveDeletePending"
                                    :disabled="confirmationText != localMembership.squad.squadName"
                                    @click="dispatchLeaveDelete"
                                >
                                    {{ leaveDeleteAction }}
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>

                    <div>
                        <pricing-notifier-wrapper
                            v-if="localMembership.squad.maxMembers !== null"
                            :tier="EPricingTier.Gold"
                            :feature="EProFeature.SquadSize"
                            shrink
                        >
                            Max Members: {{ localMembership.squad.maxMembers }}
                        </pricing-notifier-wrapper>
                    </div>
                </div>
                <v-divider class="my-4"></v-divider>

                <div class="d-flex align-center">
                    <v-tabs v-model="tab">
                        <v-tab>
                            Members ({{ localMembership.squad.memberCount }})
                        </v-tab>

                        <v-tab>
                            Invites ({{ localMembership.squad.pendingInviteCount }})
                        </v-tab>

                        <v-tab>
                            Content
                        </v-tab>

                        <v-tab>
                            Sharing
                        </v-tab>
                    </v-tabs>
                    
                    <v-dialog width="40%" v-model="showHideInvite">
                        <template v-slot:activator="{on, attrs}">
                            <v-btn class="ml-4" color="primary" v-on="on" v-bind="attrs">
                                <v-icon class="mr-2">
                                    mdi-account-multiple-plus
                                </v-icon>
                                Invite
                            </v-btn>
                        </template>

                        <squad-invite-create-card
                            :squad-id="squadId"
                            @on-send-invite="onSendInvite"
                        >
                        </squad-invite-create-card>
                    </v-dialog>
                    
                </div>

                <v-tabs-items class="pa-4" v-model="tab">
                    <v-tab-item>
                        <squad-member-table
                            v-model="squadMembers"
                            @on-kick="onSquadKick"
                            :is-owner="isOwner"
                        >
                        </squad-member-table>
                    </v-tab-item>

                    <v-tab-item>
                        <squad-invite-table
                            v-model="squadInvites"
                            @on-revoke="onSquadInviteRevoke"
                            :is-owner="isOwner"
                        >
                        </squad-invite-table>
                    </v-tab-item>

                    <v-tab-item>
                        <v-tabs vertical>
                            <v-tab>
                                VODs
                            </v-tab>

                            <v-tab-item>
                                <recent-recorded-matches
                                    title="Squad VODs"
                                    :squad-id="squadId"
                                    ref="vods"
                                >
                                    <template v-slot:actions="{pov}">
                                        <v-btn
                                            v-if="isOwner"
                                            icon
                                            small
                                            color="error"
                                            class="ml-2"
                                            @click.stop="removeVideoFromSquad(pov.vod.videoTracks[0].metadata.videoUuid)"
                                            :loading="vodRemovalProgress"
                                        >
                                            <v-icon>
                                                mdi-close-circle
                                            </v-icon>
                                        </v-btn>
                                    </template>
                                </recent-recorded-matches>
                            </v-tab-item>

                            <v-tab>
                                Clips
                            </v-tab>

                            <v-tab-item>
                                <clip-library
                                    title="Squad Clips"
                                    :squad-id="squadId"
                                    ref="clips"
                                >
                                    <template v-slot:actions="{clip}">
                                        <v-btn
                                            v-if="isOwner"
                                            icon
                                            small
                                            color="error"
                                            class="ml-2"
                                            @click.stop="removeVideoFromSquad(clip.clip.videoUuid)"
                                            :loading="vodRemovalProgress"
                                        >
                                            <v-icon>
                                                mdi-close-circle
                                            </v-icon>
                                        </v-btn>
                                    </template>
                                </clip-library>
                            </v-tab-item>
                        </v-tabs>
                    </v-tab-item>

                    <v-tab-item>
                        <squad-sharing-settings-display
                            :squad-id="squadId"
                            :is-owner="isOwner"
                            v-if="isOwner"
                        >
                        </squad-sharing-settings-display>

                        <div v-else>
                            You must be the squad owner to view/change these settings.
                        </div>
                    </v-tab-item>
                </v-tabs-items>

                <v-snackbar
                    v-model="showHideError"
                    :timeout="5000"
                    color="error"
                >
                    {{ errorMessage }}
                </v-snackbar>

                <v-snackbar
                    v-model="showHideSuccess"
                    :timeout="5000"
                    color="success"
                >
                    {{ successMessage }}
                </v-snackbar>
            </v-container>
        </template>
    </loading-container>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { apiClient, ApiData } from '@client/js/api' 
import {
    SquadMembership,
    SquadInvite,
    SquadRole
} from '@client/js/squadov/squad'
import { EPricingTier, EProFeature } from '@client/js/squadov/pricing'
import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import SquadMemberTable from '@client/vue/utility/squads/SquadMemberTable.vue'
import SquadInviteTable from '@client/vue/utility/squads/SquadInviteTable.vue'
import SquadInviteCreateCard from '@client/vue/utility/squads/SquadInviteCreateCard.vue'
import SquadSharingSettingsDisplay from '@client/vue/utility/squads/SquadSharingSettingsDisplay.vue'
import RecentRecordedMatches from '@client/vue/log/RecentRecordedMatches.vue'
import ClipLibrary from '@client/vue/utility/vods/ClipLibrary.vue'
import PricingNotifierWrapper from '@client/vue/utility/squadov/PricingNotifierWrapper.vue'
import * as pi from '@client/js/pages'

@Component({
    components: {
        LoadingContainer,
        SquadMemberTable,
        SquadInviteTable,
        SquadInviteCreateCard,
        SquadSharingSettingsDisplay,
        RecentRecordedMatches,
        ClipLibrary,
        PricingNotifierWrapper,
    }
})
export default class SingleSquadPage extends Vue {
    EPricingTier = EPricingTier
    EProFeature = EProFeature

    @Prop({required: true})
    squadId!: number
    tab: number = 0
    leaveDeletePending: boolean = false
    showHideDeleteLeave: boolean = false
    confirmationText: string = ''

    editMode: boolean = false
    editSquadName: string = ''
    editPending: boolean = false

    showHideInvite: boolean = false

    localMembership: SquadMembership | null = null
    squadMembers: SquadMembership[] | null = null
    squadInvites: SquadInvite[] | null = null

    showHideError: boolean = false
    errorMessage: string = ''

    showHideSuccess: boolean = false
    successMessage: string = ''

    vodRemovalProgress: boolean = false

    $refs!: {
        vods: RecentRecordedMatches,
        clips: ClipLibrary,
    }

    get isOwner(): boolean {
        return this.localMembership!.role == SquadRole.Owner
    }

    get leaveDeleteAction() : string {
        return this.isOwner ? 'Delete' : 'Leave'
    }

    showError(msg: string) {
        this.showHideError = true
        this.errorMessage = msg
    }

    showSuccess(msg: string) {
        this.showHideSuccess = true
        this.successMessage = msg
    }

    refreshMembers() {
        this.squadMembers = null
        apiClient.getSquadUsers(this.squadId).then((resp: ApiData<SquadMembership[]>) => {
            this.squadMembers = resp.data
        }).catch((err: any) => {
            console.error('Failed to get all squad memberships: ', err)
        })
    }

    refreshInvites() {
        this.squadInvites = null
        apiClient.getSquadInvites(this.squadId).then((resp: ApiData<SquadInvite[]>) => {
            this.squadInvites = resp.data
        }).catch((err: any) => {
            console.error('Failed to get all squad invites: ', err)
        })
    }

    @Watch('squadId')
    refreshData() {
        apiClient.getUserSquadMembership(this.squadId, this.$store.state.currentUser.id).then((resp: ApiData<SquadMembership>) => {
            this.localMembership = resp.data
        }).catch((err: any) => {
            console.error('Failed to get local squad membership: ', err)
        })

        this.refreshMembers()
        this.refreshInvites()
    }

    cancelDeleteLeave() {
        this.confirmationText = ''
        this.showHideDeleteLeave = false
    }

    deleteSquad() {
        this.leaveDeletePending = true
        apiClient.deleteSquad(this.squadId).then(() => {
            this.$router.replace({
                name: pi.UserSquadsPageId,
                params: {
                    userId: this.$store.state.currentUser.id
                }
            })
        }).catch((err: any) => {
            console.error('Failed to delete squad: ', err)
            this.showError('Failed to delete squad, please try again.')
        }).finally(() => {
            this.leaveDeletePending = true
        })
    }

    leaveSquad() {
        this.leaveDeletePending = true
        apiClient.leaveSquad(this.squadId).then(() => {
            this.$router.replace({
                name: pi.UserSquadsPageId,
                params: {
                    userId: this.$store.state.currentUser.id
                }
            })
        }).catch((err: any) => {
            console.error('Failed to leave squad: ', err)
            this.showError('Failed to leave squad, please try again.')
        }).finally(() => {
            this.leaveDeletePending = true
        })
    }

    dispatchLeaveDelete() {
        if (this.isOwner) {
            this.deleteSquad()
        } else {
            this.leaveSquad()
        }
    }

    startEdit() {
        this.editMode = true
        this.editSquadName = this.localMembership!.squad.squadName
    }

    cancelEdit() {
        this.editMode = false
    }

    saveEdit() {
        this.editPending = true

        let copy = this.editSquadName
        apiClient.editSquad(this.squadId, this.editSquadName).then(() => {
            this.localMembership!.squad.squadName = copy
            this.editMode = false
        }).catch((err: any) => {
            console.error('Failed to edit squad: ', err)
            this.showError('Failed to edit squad, please try again.')
        }).finally(() => {
            this.editPending = false
        })
    }

    onSendInvite() {
        this.showHideInvite = false
        this.refreshInvites()
    }

    onSquadKick() {
        if (!this.localMembership) {
            return
        }
        this.localMembership.squad.memberCount -= 1
    }

    onSquadInviteRevoke() {
        if (!this.localMembership) {
            return
        }
        this.localMembership.squad.pendingInviteCount -= 1
    }

    mounted() {
        this.refreshData()
    }

    removeVideoFromSquad(videoUuid: string) {
        this.vodRemovalProgress = true
        apiClient.removeVodFromSquad(this.squadId, videoUuid).then(() => {
            if (!!this.$refs.vods) {
                this.$refs.vods.removeContent(videoUuid)
            }

            if (!!this.$refs.clips) {
                this.$refs.clips.removeContent(videoUuid)
            }
        }).catch((err: any) => {
            console.error('Failed to remove vod from squad: ', err)
            this.showError('Failed to remove VOD/clip from the squad, please try again.')
        }).finally(() => {
            this.vodRemovalProgress = false
        })
    }
}

</script>

<style scoped>

.squad-group-text {
    color: rgba(255, 255, 255, 0.7);
}

</style>