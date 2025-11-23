import { ProjectileEffect } from './effects/ProjectileEffect.js';
import { ConeEffect } from './effects/ConeEffect.js';
import { BarrierEffect } from './effects/BarrierEffect.js';
import { TargetedAoEEffect } from './effects/TargetedAoEEffect.js';
import { LineEffect } from './effects/LineEffect.js';
import { GlobalEffect } from './effects/GlobalEffect.js';
import { SingleTargetEffect } from './effects/SingleTargetEffect.js';
import { ChainEffect } from './effects/ChainEffect.js';
import { BuffEffect } from './effects/BuffEffect.js';
import { SummonEffect } from './effects/SummonEffect.js';
import { LifestealEffect } from './effects/LifestealEffect.js';

export class SpellCasting {
  constructor(game, spellData, collision, effects) {
    this.game = game;
    this.spellData = spellData;
    this.collision = collision;
    this.effects = effects;
  }

  castSpell(spellId, caster) {
    const spell = this.spellData.getSpell(spellId);
    if (!spell) return;

    const targets = this.collision.detectTargets(spell, caster);
    this.effects.createEffect(spell, caster, targets);
    this.createSpellEffect(spell, caster);
  }

  createSpellEffect(spell, caster) {
    const player = this.game.playerController;
    let dmg = player.attack * spell.damageMultiplier;

    if (player.wand === `${spell.element}-wand`) dmg *= 1.1;
    else if (player.wand === 'ultimate') dmg *= 1.2;

    switch (spell.id) {
      case 'fireball':
      case 'ice-shard':
      case 'lightning':
      case 'ice-dragon':
        new ProjectileEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'flamethrower':
        new ConeEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'fire-barrier':
      case 'static-field':
        new BarrierEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'meteor':
        new TargetedAoEEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'dragon-roar':
        new LineEffect(this.game, spell, caster, dmg, true).execute();
        break;
      case 'ice-shield':
        new BarrierEffect(this.game, spell, caster, 0).execute();
        break;
      case 'blizzard':
        new ConeEffect(this.game, spell, caster, dmg).execute(); // 复用锥形
        break;
      case 'freeze':
        new SingleTargetEffect(this.game, spell, caster, dmg, true).execute();
        break;
      case 'chain-lightning':
        new ChainEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'thunderstorm':
      case 'thunder-fury':
        new GlobalEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'vine-bind':
        new SingleTargetEffect(this.game, spell, caster, dmg, true).execute();
        break;
      case 'life-drain':
        new LifestealEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'nature-blessing':
        new BuffEffect(this.game, spell, caster).execute();
        break;
      case 'summon-plants':
        new SummonEffect(this.game, spell, caster, dmg).execute();
        break;
      case 'nature-fury':
        new GlobalEffect(this.game, spell, caster, dmg, true).execute();
        break;
      default:
        console.warn(`[SpellCasting] 未实现的咒语: ${spell.id}`);
    }
  }
}