import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from "../db";
import { liveQuery } from "dexie";

export const useCommentsStore = defineStore('comment', () => {
    const allComments = ref([])

    /* Comments */
    liveQuery(async () => await db.comments.toArray()).subscribe(
        (comments) => {
            allComments.value = comments;
        },
        (error) => {
            console.log(error);
        }
    );

      return {
        allComments,
    }
})