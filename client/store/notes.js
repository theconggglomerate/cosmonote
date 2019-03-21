import Axios from 'axios'
import {runInNewContext} from 'vm'

// Action Types
const GET_NOTES = 'GET_NOTES'
const SELECT_NOTE = 'SELECT_NOTES'

// Action Creators
const getNotes = notes => ({
  type: GET_NOTES,
  notes
})

const pickNote = note => ({
  type: SELECT_NOTE,
  note
})

// Thunks
export const fetchNotes = () => async dispatch => {
  try {
    const {data: notes} = await Axios.get('/api/notes')
    dispatch(getNotes(notes))
  } catch (error) {
    console.log(error)
  }
}

export const selectNote = noteId => async dispatch => {
  try {
    const {data: note} = await Axios.get(`/api/notes/${noteId}`)
    dispatch(pickNote(note))
  } catch (error) {
    console.log(error)
  }
}

export const makeAssociation = (sourceId, targetId) => async dispatch => {
  try {
    const note = await Axios.post('/api/noteNotes/newAssociation', {
      sourceId,
      targetId
    })
    dispatch(pickNote(note.data))
  } catch (error) {
    console.log(error)
  }
}

export const deleteAssociation = (sourceId, targetId) => async dispatch => {
  try {
    const note = await Axios.delete('/api/noteNotes/association', {
      data: {sourceId, targetId}
    })
    dispatch(pickNote(note.data))
  } catch (err) {
    console.log(err)
  }
}

// Reducer
const initialState = {
  allNotes: [],
  selectedNote: {}
}

const dispatchers = {
  [GET_NOTES]: (state, action) => ({
    ...state,
    allNotes: action.notes
  }),
  [SELECT_NOTE]: (state, action) => ({
    ...state,
    selectedNote: action.note
  })
}

export default (state = initialState, action) => {
  if (action.type in dispatchers) return dispatchers[action.type](state, action)
  return state
}
