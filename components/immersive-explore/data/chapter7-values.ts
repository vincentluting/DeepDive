// ============================================================
// Chapter 7: 零号房间 The Zero Room — TwIVI Values (8 items)
// ============================================================
// 8 Schwartz value items from TwIVI (Sandy et al. 2017)
// 6-point Likert scale: "Not like me at all" → "Very much like me"
// Original item text preserved verbatim for academic validity.
//
// Narrative: "She" (the first participant) guides you through
// 8 mirrors, each showing a possible version of you.
// ============================================================

import type { ImmersiveQuestion } from "./types";

export const CHAPTER7_QUESTIONS: ImmersiveQuestion[] = [
  // ── 幕一 · 近处 The Near (Benevolence) ──────────────────────

  {
    id: 31,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 1,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 3,
    miniIpCode: "TW3",
    miniIpItem:
      "It's very important to this person to help the people around them. They want to care for their well-being.",
    scene: {
      zh: `第一面镜子亮了。

里面的人长得像你，但他们的注意力不在自己身上。他们弯下腰，在听一个朋友说话。不是敷衍地点头——是真的在听，在确认对方还好不好。

她没有看镜子。她在看你。`,
      en: `The first mirror lights up.

The person inside looks like you, but their attention isn't on themselves. They're leaning in, listening to a friend. Not nodding along — truly listening, checking if the other person is okay.

She doesn't look at the mirror. She's watching you.`,
    },
    taskDescription: {
      zh: "帮助周围的人对这个人非常重要。他们想要关心身边人过得好不好。",
      en: "It's very important to this person to help the people around them. They want to care for their well-being.",
    },
    mirrorFeedback: {
      score1: {
        zh: "镜面暗了一瞬。你摇了摇头。她的表情没有变化——但她似乎在你开口之前就知道了答案。",
        en: "The mirror dims for a moment. You shake your head. Her expression doesn't change — but she seemed to know the answer before you gave it.",
      },
      score2: {
        zh: "你看着镜子，然后移开了目光。她没有追问。",
        en: "You look at the mirror, then look away. She doesn't press.",
      },
      score3: {
        zh: "镜中人的轮廓在你眼前有些模糊。你认得出一些自己的影子，但它不是第一个浮上来的画面。",
        en: "The reflection blurs slightly before your eyes. You recognize some of yourself, but it's not the first image that surfaces.",
      },
      score4: {
        zh: "你想了一下。不是犹豫，是在确认。她看着你思考的样子，没有催你。",
        en: "You think for a moment. Not hesitation — confirmation. She watches you think, unhurried.",
      },
      score5: {
        zh: "你看着镜中人，点了点头。她记下了什么——不是写在纸上，是记在眼睛里。",
        en: "You look at the reflection and nod. She notes something — not on paper. In her eyes.",
      },
      score6: {
        zh: "你几乎没有犹豫。她轻轻点了一下头，像是确认了一件她已经知道的事。",
        en: "You barely hesitate. She nods slightly, as if confirming something she already knew.",
      },
    },
  },

  {
    id: 32,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 2,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 13,
    miniIpCode: "TW13",
    miniIpItem:
      "It is important to this person to respond to the needs of others. They try to support those they know.",
    scene: {
      zh: `第二面镜子。

这一次，镜中人不只是在听——他们已经站起来了。有人发出了求助信号，镜中人正在走过去。不是那种轰轰烈烈的英雄画面，是更安静的东西：有人需要帮助，而这个人认识他们，所以他们去了。就这么简单。

她的目光从镜子移回到你脸上。等待。`,
      en: `The second mirror.

This time, the person isn't just listening — they're already on their feet. Someone sent a signal for help, and the person in the mirror is walking toward them. Not a dramatic hero shot — something quieter: someone needs help, and this person knows them, so they go. That simple.

Her gaze moves from the mirror back to your face. Waiting.`,
    },
    taskDescription: {
      zh: "回应他人的需求对这个人很重要。他们尽力帮助自己认识的人。",
      en: "It is important to this person to respond to the needs of others. They try to support those they know.",
    },
    mirrorFeedback: {
      score1: {
        zh: "你看到了画面，但你的脚没有动。她看了你一眼——不是失望，是记录。",
        en: "You see the scene, but your feet don't move. She glances at you — not disappointment. Recording.",
      },
      score2: {
        zh: "你的视线停留了一下，然后平静地做出了选择。她接受了这个答案。",
        en: "Your gaze lingers briefly, then you make your choice calmly. She accepts it.",
      },
      score3: {
        zh: "你看着镜中人站起来的动作，觉得有些距离。不是不认同——是那种反射式的行动力不太属于你。",
        en: "You watch the person rise and feel some distance. Not disagreement — that reflexive action isn't quite yours.",
      },
      score4: {
        zh: "你会去，但不是每次都这么快。她看到了你脸上那一秒的计算，没有评价。",
        en: "You'd go, but not always this fast. She sees the second of calculation on your face and makes no judgment.",
      },
      score5: {
        zh: "你没有犹豫太久。这很像你——有人需要帮助，你会去。她微微侧过头，像在记住你这个反应。",
        en: "You don't hesitate long. This is like you — someone needs help, you go. She tilts her head slightly, as if memorizing this response.",
      },
      score6: {
        zh: "镜中人起身的速度和你一模一样。她看着你，眼神里多了一层温度。",
        en: "The reflection rises at exactly your speed. She watches you, something warmer in her gaze.",
      },
    },
  },

  // ── 幕二 · 远方 The Far (Universalism) ──────────────────────

  {
    id: 33,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 3,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 4,
    miniIpCode: "TW4",
    miniIpItem:
      "This person thinks it is important that every person in the world be treated equally. They believe everyone should have equal opportunities in life.",
    scene: {
      zh: `第三面镜子。

镜面里的世界很大。不再是一间房间——是街道、城市、人群。不同的面孔，不同的语言，不同的起点。镜中人站在他们中间，不是在领导，不是在帮助——是在坚持一件事：每一个人，都应该站在同样的起跑线上。

她看着那个世界。然后转向你。`,
      en: `The third mirror.

The world inside is vast. No longer a room — streets, cities, crowds. Different faces, different languages, different starting points. The person in the mirror stands among them, not leading, not helping — insisting on one thing: every single person should stand at the same starting line.

She watches that world. Then she turns to you.`,
    },
    taskDescription: {
      zh: "这个人认为世界上每个人都应该被平等对待。他们相信每个人都应该拥有平等的机会。",
      en: "This person thinks it is important that every person in the world be treated equally. They believe everyone should have equal opportunities in life.",
    },
    mirrorFeedback: {
      score1: {
        zh: "你直视了那面镜子，然后平静地做了选择。她没有追问——她看到了你眼神里的诚实。",
        en: "You look the mirror straight on, then choose calmly. She doesn't press — she sees the honesty in your eyes.",
      },
      score2: {
        zh: "那是一个很远的画面。你能理解它的意义，但它不是早上让你起床的东西。",
        en: "That's a distant image. You understand its significance, but it's not what gets you out of bed.",
      },
      score3: {
        zh: "那面镜子映出了一种你理解但不完全拥有的东西。她看着你的表情，像在读一段复杂的文本。",
        en: "The mirror shows something you understand but don't fully own. She reads your expression like a complex text.",
      },
      score4: {
        zh: "你相信平等，但你知道这个信念在现实中有多难。镜中人的坚持让你既敬佩又犹豫。",
        en: "You believe in equality, but you know how hard it is in practice. The reflection's insistence makes you both admire and hesitate.",
      },
      score5: {
        zh: "你认同那面镜子。不是狂热，是一种安静的确信。她看着你，呼吸似乎放慢了一拍。",
        en: "You agree with that mirror. Not fervently — a quiet certainty. She watches you, her breath seeming to slow a beat.",
      },
      score6: {
        zh: `你看向那个世界，觉得理所当然。她看到了你的眼神——那种不需要说服的坚定。她轻声说："我知道了。"`,
        en: `You look at that world and find it self-evident. She sees your eyes — that conviction that needs no persuading. She whispers: "I see."`,
      },
    },
  },

  {
    id: 34,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 4,
    isClimax: true,
    scaleMax: 6,
    twiviItemId: 14,
    miniIpCode: "TW14",
    miniIpItem:
      "This person believes all the world's people should live in harmony. Promoting peace among all groups in the world is important to them.",
    scene: {
      zh: `第四面镜子。

镜中的世界变了。不再是拥挤的人群——是几个群体，背对着彼此。镜中人站在他们之间的裂缝上。不是选边。是搭桥。你能感觉到那种沉重——让所有人和谐相处，不是一句口号，是一辈子的重量。

她呼出一口气。然后看向你。`,
      en: `The fourth mirror.

The world inside has shifted. No longer a crowd — several groups, backs turned to each other. The person stands on the crack between them. Not choosing sides. Building bridges. You can feel the weight — making everyone live in harmony isn't a slogan. It's a lifetime's burden.

She breathes out. Then turns to you.`,
    },
    taskDescription: {
      zh: "这个人相信世界上所有人都应该和谐相处。促进世界各群体之间的和平对他们很重要。",
      en: "This person believes all the world's people should live in harmony. Promoting peace among all groups in the world is important to them.",
    },
    mirrorFeedback: {
      score1: {
        zh: "你看着那道裂缝，知道它存在。但你选择把力量用在你能真正改变的地方。她理解了。",
        en: "You see the crack and know it's real. But you choose to spend your strength where you can truly make a difference. She understands.",
      },
      score2: {
        zh: "你尊重站在裂缝上的人。但你知道你的战场在别处。",
        en: "You respect the person on the crack. But you know your battlefield is elsewhere.",
      },
      score3: {
        zh: "你看着裂缝，有一瞬间想走上去。但那个冲动没有持续太久。",
        en: "You look at the crack and for a moment want to step onto it. But the impulse doesn't last.",
      },
      score4: {
        zh: "你相信和谐，但你也知道搭桥的人往往两边不讨好。这面镜子让你既认同又疲惫。",
        en: "You believe in harmony, but you know bridge-builders often please neither side. This mirror makes you both agree and weary.",
      },
      score5: {
        zh: "你愿意搭桥。不是因为天真，是因为你见过不搭桥的后果。她从你的反应里看到了经历。",
        en: "You'd build the bridge. Not from naivety — because you've seen what happens when no one does. She reads experience in your reaction.",
      },
      score6: {
        zh: "你看着那道裂缝，她注意到你的手不自觉地握紧了。你知道这个重量，因为你一直在扛。",
        en: "You see the crack, and she notices your hand clench involuntarily. You know this weight because you've always carried it.",
      },
    },
  },

  // ── 幕三 · 攀升 The Ascent (Achievement) ────────────────────

  {
    id: 35,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 5,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 8,
    miniIpCode: "TW8",
    miniIpItem:
      "Getting ahead in life is important to this person. They strive to do better than others.",
    scene: {
      zh: `第五面镜子。光线变了——更亮，更锐利。像聚光灯。

镜中人在攀爬。不是一座山——是一张看不见的排名表。他们的每一步都在计算：我在哪里？谁在我前面？怎么更快？这种人不满足于"还不错"。他们要的是第一个到达。

她看着你。不再是好奇。是审视。`,
      en: `The fifth mirror. The light changes — brighter, sharper. Like a spotlight.

The person inside is climbing. Not a mountain — an invisible leaderboard. Every step calculated: Where am I? Who's ahead? How do I go faster? This person isn't satisfied with "good enough." They want to arrive first.

She looks at you. No longer curiosity. Scrutiny.`,
    },
    taskDescription: {
      zh: "出人头地对这个人很重要。他们努力比别人做得更好。",
      en: "Getting ahead in life is important to this person. They strive to do better than others.",
    },
    mirrorFeedback: {
      score1: {
        zh: "你看着那个攀爬的人，感到一种清晰的距离。她注意到了你的平静——那也是一种答案。",
        en: "You watch the climber and feel a clear distance. She notices your calm — that too is an answer.",
      },
      score2: {
        zh: "那张排名表像是别人的游戏。你不是不想赢——你只是不觉得赢是最有意思的事。",
        en: "That leaderboard feels like someone else's game. Not that you don't want to win — winning just isn't the most interesting thing.",
      },
      score3: {
        zh: "那面镜子映出了一种你偶尔会感受到的东西——但它不是你的常态。",
        en: "The mirror shows something you feel occasionally — but it's not your norm.",
      },
      score4: {
        zh: "竞争这件事，你不排斥。但你更在意的是和自己比，不是和别人比。镜子只说对了一半。",
        en: "Competition doesn't repel you. But you care more about beating yourself than others. The mirror is only half right.",
      },
      score5: {
        zh: "你看着那张排名表，感到一种熟悉的拉力。不是贪婪——是标准。你对自己有要求。",
        en: "You look at the leaderboard and feel a familiar pull. Not greed — standards. You hold yourself to them.",
      },
      score6: {
        zh: "你的心跳加速了。她看到了——不是紧张，是兴奋。你认识这种饥饿感。她审视你的眼神里多了一层尊重。",
        en: "Your heartbeat quickens. She sees it — not anxiety, excitement. You know this hunger. Her scrutiny shifts to something like respect.",
      },
    },
  },

  {
    id: 36,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 6,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 18,
    miniIpCode: "TW18",
    miniIpItem:
      "Being very successful is important to this person. They like to impress other people.",
    scene: {
      zh: `第六面镜子。

镜中人站在一个舞台中央。不是第三章的那种剧场——那个是关于创造的。这个舞台是关于被看见的。镜中人刚刚完成了一件了不起的事。人群的目光聚焦过来。掌声。印象深刻。那种感觉——对镜中人来说——比掌声本身更重要。

她嘴角浮起一丝什么。不太像笑。`,
      en: `The sixth mirror.

The person stands at center stage. Not the theater from Chapter Three — that one was about creation. This stage is about being seen. The person has just accomplished something remarkable. The crowd's gaze locks on. Applause. Impressed. That feeling — for the person in the mirror — matters more than the applause itself.

Something flickers at the corner of her mouth. Not quite a smile.`,
    },
    taskDescription: {
      zh: "取得很大的成功对这个人很重要。他们喜欢给别人留下深刻印象。",
      en: "Being very successful is important to this person. They like to impress other people.",
    },
    mirrorFeedback: {
      score1: {
        zh: "你看着那个舞台，什么都没感觉到。她记录了你的沉默——沉默也是一种清晰的回答。",
        en: "You look at that stage and feel nothing. She records your silence — silence is also a clear answer.",
      },
      score2: {
        zh: "掌声对你来说是附属品。你可以做到很好，但你不需要别人的目光来验证。",
        en: "Applause is a byproduct for you. You can do well, but you don't need others' eyes to validate it.",
      },
      score3: {
        zh: "那面镜子有一些你的影子，但你很快就从这个画面里抽离了。",
        en: "There's some of you in that mirror, but you disengage from the image quickly.",
      },
      score4: {
        zh: `你享受被认可，但"给人留下印象"这个说法让你犹豫了一秒。你更在意的是实质，不是印象。`,
        en: `You enjoy recognition, but "impress" gives you a second's pause. You care more about substance than impression.`,
      },
      score5: {
        zh: "成功的感觉确实重要。你不会假装不在意。她对你的坦诚微微扬了一下眉。",
        en: "The feeling of success does matter. You won't pretend otherwise. She raises an eyebrow slightly at your honesty.",
      },
      score6: {
        zh: "你知道那种感觉。站在聚光灯下，感受到注视——不是虚荣，是确认自己存在的方式。她看到了你眼中的光。",
        en: "You know that feeling. Under the spotlight, feeling every gaze — not vanity, but how you confirm your own existence. She sees the light in your eyes.",
      },
    },
  },

  // ── 幕四 · 权座 The Throne (Power) ──────────────────────────

  {
    id: 37,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 7,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 9,
    miniIpCode: "TW9",
    miniIpItem:
      "This person always wants to be the one who makes the decisions. They like to be the leader.",
    scene: {
      zh: `第七面镜子。镜框比其他的都深，表面几乎是黑色的——直到你走近，画面才慢慢浮现。

镜中人坐在一张桌子的主位。不是因为别人让他坐那里——是因为当需要有人做决定的时候，所有人都在等，而镜中人已经开口了。做决定这件事，对有些人来说是压力。对镜中人来说，是本能。

她退后。半步。这一面，只在你和镜子之间。`,
      en: `The seventh mirror. Its frame is deeper than the others, the surface nearly black — until you step closer, and the image slowly surfaces.

The person sits at the head of a table. Not because anyone placed them there — but because when a decision needed to be made, everyone waited, and this person already spoke. Decision-making, for some, is pressure. For this person, it's instinct.

She steps back. Half a step. This one is between you and the mirror.`,
    },
    taskDescription: {
      zh: "这个人总想成为做决定的那个人。他们喜欢当领导者。",
      en: "This person always wants to be the one who makes the decisions. They like to be the leader.",
    },
    mirrorFeedback: {
      score1: {
        zh: "镜中人坐在主位上，你下意识后退了半步。她注意到了你的后退——然后她的紧张消退了一些。",
        en: "The reflection sits at the head, and you instinctively step back. She notices your retreat — and some of her tension eases.",
      },
      score2: {
        zh: "那个位置对你来说太重了。你宁愿影响方向，也不想做最终拍板的人。",
        en: "That seat feels too heavy. You'd rather influence direction than make the final call.",
      },
      score3: {
        zh: `你看着那个位置，感觉有些距离。你可以做决定，但"总想成为那个人"——不太是你。`,
        en: `You look at the seat with some distance. You can decide, but "always wanting to be the one" — that's not quite you.`,
      },
      score4: {
        zh: "你可以坐在那里，如果需要的话。但你更希望决策是共同的过程，不是一个人的事。",
        en: "You could sit there if needed. But you'd prefer decisions to be shared, not solitary.",
      },
      score5: {
        zh: "你不排斥那个位置。当局面需要有人站出来，你是最早举手的那几个人之一。她在你的反应里看到了一种自然的掌控力。",
        en: "You don't shy from that seat. When someone needs to step up, you're among the first. She sees a natural command in your response.",
      },
      score6: {
        zh: "你看着那个位置，觉得那本来就是你的。不是傲慢——你知道如果你不坐在那里，决定会更慢、更差。她看到了你的确定。她紧张了一瞬。",
        en: "You look at that seat and feel it was always yours. Not arrogance — you know without you there, decisions would be slower, worse. She sees your certainty. For a moment, she tenses.",
      },
    },
  },

  {
    id: 38,
    chapter: "values",
    chapterIndex: 7,
    questionInChapter: 8,
    isClimax: false,
    scaleMax: 6,
    twiviItemId: 19,
    miniIpCode: "TW19",
    miniIpItem:
      "It is important to this person to be in charge and tell others what to do. They want people to do what they say.",
    scene: {
      zh: `最后一面镜子。

她没有说话。她只是站在那里，等你自己走过去。

你走近了。

这面镜子里的画面最安静，也最沉重。镜中人不是在做某一个决定——他们在掌控整个局面。谁做什么，什么时候做，怎么做——都由他们说了算。房间里的其他人不是在合作。是在服从。

这是八面镜子中最赤裸的一面。它不问你想不想帮助人，不问你信不信平等，不问你想不想赢。

它问的是：你想不想被人听从。

她看着你走向最后一面镜子。不是好奇。不是审视。

是紧张。`,
      en: `The last mirror.

She says nothing. She just stands there, waiting for you to walk to it yourself.

You step closer.

The image here is the quietest, and the heaviest. The person isn't making one decision — they're controlling the entire situation. Who does what, when, how — all decided by them. The others in the room aren't collaborating. They're obeying.

This is the most naked of the eight mirrors. It doesn't ask whether you want to help people, whether you believe in equality, whether you want to win.

It asks: do you want to be obeyed.

She watches you approach the last mirror. Not curiosity. Not scrutiny.

Tension.`,
    },
    taskDescription: {
      zh: "对这个人来说，掌控局面并告诉别人该怎么做很重要。他们想让别人按他们说的做。",
      en: "It is important to this person to be in charge and tell others what to do. They want people to do what they say.",
    },
    mirrorFeedback: {
      score1: {
        zh: "你直视那面镜子，然后摇了摇头。她看到了你的决定。她的肩膀似乎放松了一些。",
        en: "You look the mirror straight on, then shake your head. She sees your decision. Her shoulders seem to relax slightly.",
      },
      score2: {
        zh: "这面镜子让你不太舒服。不是因为它不好——是因为它太不像你了。",
        en: "This mirror makes you uncomfortable. Not because it's wrong — because it's so unlike you.",
      },
      score3: {
        zh: "你对着镜子想了一会儿。控制？有时候。但大多数时候，你更想影响而不是命令。",
        en: "You pause before the mirror. Control? Sometimes. But mostly you'd rather influence than command.",
      },
      score4: {
        zh: `你能做到。但"让别人按你说的做"——这个说法让你不太舒服。你更想说服，不想命令。`,
        en: `You're capable of it. But "wanting people to do what you say" — that phrasing makes you uneasy. You'd rather persuade than command.`,
      },
      score5: {
        zh: "掌控局面对你有吸引力。你知道怎么让事情运转，你不介意给出指令。她深吸了一口气。",
        en: "Taking charge appeals to you. You know how to make things work, and you don't mind giving orders. She takes a slow breath.",
      },
      score6: {
        zh: "你没有回避。是的，你想要控制——因为你相信你的判断。她直视你，这一次，她的表情里有了某种你说不清的东西。像是辨认。",
        en: "You don't look away. Yes, you want control — because you trust your judgment. She meets your gaze, and this time, there's something in her face you can't name. Like recognition.",
      },
    },
  },
];
