import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AVATAR_LOOK,
  EFacialHair,
  EHairColor,
  EHairStyle,
  EOutfitColor,
  ESkinTone,
  type AvatarLook,
} from '@/contracts/avatar'
import AvatarEditor from './AvatarEditor.vue'

const LOOK: AvatarLook = {
  skin: ESkinTone.Medium,
  hairStyle: EHairStyle.Curly,
  hairColor: EHairColor.Black,
  outfit: EOutfitColor.Blue,
  facialHair: EFacialHair.None,
  blush: true,
}

function setup(look: AvatarLook = LOOK): ReturnType<typeof mount<typeof AvatarEditor>> {
  return mount(AvatarEditor, { props: { look } })
}

function pressed(wrapper: ReturnType<typeof setup>, test: string): string | undefined {
  return wrapper.get(`[data-test="${test}"]`).attributes('aria-pressed')
}

describe('AvatarEditor', () => {
  it('shows her look and every choice, in Spanish', () => {
    const wrapper = setup()
    expect(wrapper.get('h2').text()).toBe('Tu personaje')
    expect(wrapper.findAll('legend').map((legend) => legend.text())).toEqual([
      'Piel',
      'Peinado',
      'Color de pelo',
      'Barba y bigote',
      'Colorete',
      'Ropa',
    ])
    expect(wrapper.findAll('[data-test^="skin-"]')).toHaveLength(5)
    expect(wrapper.findAll('[data-test^="hair-style-"]')).toHaveLength(8)
    expect(wrapper.findAll('[data-test^="facial-hair-"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-test^="blush-"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-test^="hair-color-"]')).toHaveLength(6)
    expect(wrapper.findAll('[data-test^="outfit-"]')).toHaveLength(8)
    expect(wrapper.get('[data-test="hair-style-bun"]').text()).toBe('Moño')
    expect(wrapper.get('[data-test="outfit-teal"]').attributes('aria-label')).toBe('Ropa turquesa')
    expect(pressed(wrapper, 'skin-medium')).toBe('true')
    expect(pressed(wrapper, 'hair-style-curly')).toBe('true')
    expect(pressed(wrapper, 'hair-color-black')).toBe('true')
    expect(pressed(wrapper, 'outfit-blue')).toBe('true')
    expect(pressed(wrapper, 'outfit-red')).toBe('false')
    expect(pressed(wrapper, 'facial-hair-none')).toBe('true')
    expect(pressed(wrapper, 'blush-on')).toBe('true')
    expect(pressed(wrapper, 'blush-off')).toBe('false')
    expect(wrapper.find('canvas[aria-label="Vista previa de tu personaje"]').exists()).toBe(true)
  })

  it('previews every hairstyle on her own look', () => {
    const wrapper = setup()
    const labels = wrapper
      .findAll('[data-test^="hair-style-"] canvas')
      .map((canvas) => canvas.attributes('aria-label'))
    expect(labels).toEqual([
      'Media melena',
      'Largo',
      'Coleta',
      'Rizos',
      'Moño',
      'Corto',
      'Rapado',
      'Con raya',
    ])
  })

  it('offers facial hair and cheeks as free features, previewed on her look', async () => {
    const wrapper = setup()
    const labels = wrapper
      .findAll('[data-test^="facial-hair-"] canvas')
      .map((canvas) => canvas.attributes('aria-label'))
    expect(labels).toEqual(['Nada', 'Bigote', 'Barba'])
    expect(wrapper.text()).not.toMatch(/hombre|mujer|género/i)

    await wrapper.get('[data-test="facial-hair-beard"]').trigger('click')
    await wrapper.get('[data-test="blush-off"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([
      [{ ...LOOK, facialHair: EFacialHair.Beard }],
      [{ ...LOOK, facialHair: EFacialHair.Beard, blush: false }],
    ])
    expect(pressed(wrapper, 'facial-hair-beard')).toBe('true')
    expect(pressed(wrapper, 'blush-off')).toBe('true')
  })

  it('emits the whole new look on every pick', async () => {
    const wrapper = setup()
    await wrapper.get('[data-test="skin-dark"]').trigger('click')
    await wrapper.get('[data-test="hair-style-bun"]').trigger('click')
    await wrapper.get('[data-test="hair-color-red"]').trigger('click')
    await wrapper.get('[data-test="outfit-pink"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([
      [{ ...LOOK, skin: ESkinTone.Dark }],
      [{ ...LOOK, skin: ESkinTone.Dark, hairStyle: EHairStyle.Bun }],
      [{ ...LOOK, skin: ESkinTone.Dark, hairStyle: EHairStyle.Bun, hairColor: EHairColor.Red }],
      [
        {
          skin: ESkinTone.Dark,
          hairStyle: EHairStyle.Bun,
          hairColor: EHairColor.Red,
          outfit: EOutfitColor.Pink,
          facialHair: LOOK.facialHair,
          blush: LOOK.blush,
        },
      ],
    ])
    expect(pressed(wrapper, 'outfit-pink')).toBe('true')
    expect(pressed(wrapper, 'outfit-blue')).toBe('false')
  })

  it('saves only once something changed, with the new look', async () => {
    const wrapper = setup()
    const save = wrapper.get('[data-test="save"]')
    expect(save.text()).toBe('Guardar')
    expect(save.attributes('disabled')).toBeDefined()
    await wrapper.get('[data-test="hair-color-grey"]').trigger('click')
    expect(save.attributes('disabled')).toBeUndefined()
    await save.trigger('click')
    expect(wrapper.emitted('save')).toEqual([[{ ...LOOK, hairColor: EHairColor.Grey }]])
  })

  it('cancels back to her saved look', async () => {
    const wrapper = setup()
    await wrapper.get('[data-test="outfit-green"]').trigger('click')
    await wrapper.get('[data-test="cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(pressed(wrapper, 'outfit-blue')).toBe('true')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })

  it('goes back to the default look, unless it already is', async () => {
    const wrapper = setup()
    await wrapper.get('[data-test="default"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[DEFAULT_AVATAR_LOOK]])
    expect(wrapper.get('[data-test="default"]').attributes('disabled')).toBeDefined()
    expect(
      setup(DEFAULT_AVATAR_LOOK).get('[data-test="default"]').attributes('disabled')
    ).toBeDefined()
  })

  it('follows a new saved look from its parent', async () => {
    const wrapper = setup()
    await wrapper.setProps({ look: { ...LOOK, skin: ESkinTone.Light } })
    expect(pressed(wrapper, 'skin-light')).toBe('true')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })
})
