<template>
    <div>
        <div class="d-flex align-center">
            <div class="font-weight-bold">{{ label }}</div>

            <v-spacer></v-spacer>

            <v-tooltip bottom max-width="450px">
                <template v-slot:activator="{on, attrs}">
                    <v-icon v-on="on" v-bind="attrs">
                        mdi-help-circle
                    </v-icon>
                </template>

                {{ tooltip }}
            </v-tooltip>
        </div>

        <v-divider class="my-2"></v-divider>

        <v-checkbox
            v-model="public"
            @change="syncToValue"
            hide-details
            label="Public"
        >
            <template v-slot:append>
                <v-tooltip bottom max-width="450px">
                    <template v-slot:activator="{on, attrs}">
                        <v-icon v-on="on" v-bind="attrs">
                            mdi-help-circle
                        </v-icon>
                    </template>

                    If checked, will allow everyone with your profile URL to access this part of your profile.
                </v-tooltip>
            </template>
        </v-checkbox>

        <template v-if="!public">
            <v-checkbox
                v-model="sameSquad"
                @change="syncToValue"
                hide-details
                label="Same Squad"
            >
                <template v-slot:append>
                    <v-tooltip bottom max-width="450px">
                        <template v-slot:activator="{on, attrs}">
                            <v-icon v-on="on" v-bind="attrs">
                                mdi-help-circle
                            </v-icon>
                        </template>

                        If checked, will allow people in the same squad as you to view this part of your profile.
                    </v-tooltip>
                </template>
            </v-checkbox>

            <v-checkbox
                v-model="twitchSub"
                @change="syncToValue"
                hide-details
                label="Twitch Sub"
                v-if="twitch"
            >
                <template v-slot:append>
                    <v-tooltip bottom max-width="450px">
                        <template v-slot:activator="{on, attrs}">
                            <v-icon v-on="on" v-bind="attrs">
                                mdi-help-circle
                            </v-icon>
                        </template>

                        If checked, will allow people who have Twitch subbed to you to view this part of your profile (requires both users to have Twitch accounts linked to SquadOV).
                    </v-tooltip>
                </template>
            </v-checkbox>
        </template>
    </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { USER_PROFILE_ACCESS_PUBLIC, USER_PROFILE_ACCESS_PRIVATE_TWITCH_SUB, USER_PROFILE_ACCESS_PRIVATE_SQUADS } from '@client/js/squadov/user'

@Component
export default class UserProfileAccessEditor extends Vue {
    @Prop({required: true})
    label!: string

    @Prop({required: true})
    tooltip!: string

    @Prop({required: true})
    value!: number

    @Prop({default: false})
    twitch!: boolean

    sameSquad: boolean = false
    twitchSub: boolean = false
    public: boolean = false

    @Watch('value')
    syncFromValue() {
        if (this.value == USER_PROFILE_ACCESS_PUBLIC) {
            this.public = true
        } else {
            this.sameSquad = (this.value & USER_PROFILE_ACCESS_PRIVATE_SQUADS) > 0
            this.twitchSub = (this.value & USER_PROFILE_ACCESS_PRIVATE_TWITCH_SUB) > 0
        }
    }

    syncToValue() {
        this.$emit('input', this.finalValue)
    }

    get finalValue(): number {
        if (this.public) {
            return USER_PROFILE_ACCESS_PUBLIC
        } else {
            let value = 0
            if (this.sameSquad) {
                value |= USER_PROFILE_ACCESS_PRIVATE_SQUADS
            }

            if (this.twitchSub) {
                value |= USER_PROFILE_ACCESS_PRIVATE_TWITCH_SUB
            }
            return value
        }
    }

    mounted() {
        this.syncFromValue()
    }
}

</script>