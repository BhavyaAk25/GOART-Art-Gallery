export type Painting = {
  id: string
  title: string
  artist: string
  year: string
  medium: string
  description: string
  imageUrl: string
}

export const paintings: Painting[] = [
  {
    id: 'matisse-bathers',
    title: 'Bathers by a River',
    artist: 'Henri Matisse',
    year: '1909–10, 1913, 1916–17',
    medium: 'Oil on canvas',
    description:
      'Figure fragments flatten into bands of green and gray, turning a riverbank into pure rhythm. The bodies feel carved into the surface, as if sculpture melted into paint.',
    imageUrl: 'https://www.artic.edu/iiif/2/419ddce3-c90b-3d0c-43b3-73683a87bf98/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-aquarium',
    title: 'Woman before an Aquarium',
    artist: 'Henri Matisse',
    year: '1921–23',
    medium: 'Oil on canvas',
    description:
      'A quiet interior: woman, plants, and goldfish bowl stack into calm vertical layers. Matisse lets the verticals guide your eye like a slow breath through the room.',
    imageUrl: 'https://www.artic.edu/iiif/2/d0e36029-27fc-bf4e-357a-55cfbaf7bdfd/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-nice',
    title: 'Interior at Nice',
    artist: 'Henri Matisse',
    year: '1919 or 1920',
    medium: 'Oil on canvas',
    description:
      'Sunlight, shutters, and patterned fabrics turn a simple room into a stage of color. Every textile and shadow becomes a gentle note in a domestic symphony.',
    imageUrl: 'https://www.artic.edu/iiif/2/2193cdda-2691-2802-0776-145dee77f7ea/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-apples',
    title: 'Apples',
    artist: 'Henri Matisse',
    year: '1916',
    medium: 'Oil on canvas',
    description:
      'Vibrant fruit and a cobalt cloth reduce still life to bold shapes and balance. Color blocks stack like cut paper, hinting at the cut-outs to come.',
    imageUrl: 'https://www.artic.edu/iiif/2/b2bc0fc2-8d17-1fcd-8cae-8626421c11ef/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-daisies',
    title: 'Daisies',
    artist: 'Henri Matisse',
    year: '1939',
    medium: 'Oil on canvas',
    description:
      'White blooms float above a patterned cloth, glowing against gentle blues and greens. It’s a late bouquet where simplicity and lightness do the storytelling.',
    imageUrl: 'https://www.artic.edu/iiif/2/1693f1ff-40a4-e0e2-16cd-3d8d055dc266/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-guitarist',
    title: 'The Old Guitarist',
    artist: 'Pablo Picasso',
    year: 'Late 1903 – early 1904',
    medium: 'Oil on panel',
    description:
      'A blue-toned figure cradles his guitar, the only warm note in a cold world. The body bends around the instrument, as if music is the last thread of warmth.',
    imageUrl: 'https://www.artic.edu/iiif/2/4e7f3081-179a-af18-8abd-7908a7ae8c4e/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-kahnweiler',
    title: 'Daniel-Henry Kahnweiler',
    artist: 'Pablo Picasso',
    year: 'Autumn 1910',
    medium: 'Oil on canvas',
    description:
      'Cubist facets of a dealer’s portrait crystallize into planes of ochre and gray. The subject dissolves into geometry, but the gaze still holds steady.',
    imageUrl: 'https://www.artic.edu/iiif/2/aebda29e-16b8-4393-6edc-805cdb6ba459/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-red-armchair',
    title: 'The Red Armchair',
    artist: 'Pablo Picasso',
    year: 'December 16, 1931',
    medium: 'Oil and Ripolin on panel',
    description:
      'A seated figure twists into biomorphic curves against a lush scarlet chair. The glossy Ripolin paint adds a lacquered sheen that makes the forms pulse.',
    imageUrl: 'https://www.artic.edu/iiif/2/c617e2f0-d5fe-0772-390e-6d8c83895815/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-mother-child',
    title: 'Mother and Child',
    artist: 'Pablo Picasso',
    year: '1921',
    medium: 'Oil on canvas',
    description:
      'A monumental mother cradles her child, rendered in strong classical volumes. Tenderness lives inside solid forms, blending ancient calm with modern line.',
    imageUrl: 'https://www.artic.edu/iiif/2/64734461-887d-80b9-8489-e38cb05ac01d/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-man-pipe',
    title: 'Man with a Pipe',
    artist: 'Pablo Picasso',
    year: '1915',
    medium: 'Oil on canvas',
    description:
      'Cubist shards arrange a sitter and his pipe into angular layers of browns and grays. The smoke seems to hang in the fractures, suspending time in facets.',
    imageUrl: 'https://www.artic.edu/iiif/2/43bc66e2-95b2-fb3c-b9b1-232835bfd027/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-geranium',
    title: 'Still Life with Geranium',
    artist: 'Henri Matisse',
    year: '1906',
    medium: 'Oil on canvas',
    description:
      'A single potted geranium sits with bottles and fruit, its leaves glowing against muted violets. Matisse turns a tabletop into a study of light bouncing across humble things.',
    imageUrl: 'https://www.artic.edu/iiif/2/d0049e0b-bd55-020e-aa8c-b137d06ae7df/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-lemons',
    title: 'Lemons on a Pewter Plate',
    artist: 'Henri Matisse',
    year: '1926',
    medium: 'Oil on canvas',
    description:
      'Bright lemons glow against the cool sheen of pewter, a duet of color and metal. The painting feels like a pause, catching citrus light before it slips away.',
    imageUrl: 'https://www.artic.edu/iiif/2/79f1c666-1e19-af39-f7e0-f22989835eb2/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-laurette-coffee',
    title: 'Laurette with a Cup of Coffee',
    artist: 'Henri Matisse',
    year: '1916–17',
    medium: 'Oil on canvas',
    description:
      'Laurette leans toward a small cup, patterns rippling around her in deep greens and blacks. The quiet gesture becomes ceremonial, held in pools of saturated color.',
    imageUrl: 'https://www.artic.edu/iiif/2/72d28816-c42f-af88-63fc-d12426db240e/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-girl-guitar',
    title: 'Girl in Yellow and Blue with Guitar',
    artist: 'Henri Matisse',
    year: '1939',
    medium: 'Oil on canvas',
    description:
      'A guitarist in lemon and azure balances curves of the instrument with blocks of flat color. Music turns into color chords, strummed across the canvas.',
    imageUrl: 'https://www.artic.edu/iiif/2/0fc277a0-003c-393f-556b-f8dbc8c81427/full/1200,/0/default.jpg',
  },
  {
    id: 'matisse-girl-reading',
    title: 'A Girl Reading',
    artist: 'Henri Matisse',
    year: '1923',
    medium: 'Lithograph on wove paper',
    description:
      'A young reader bends into the page, drawn with economical black lines on soft paper. The scene is hushed, letting the whiteness of the sheet become light itself.',
    imageUrl: 'https://www.artic.edu/iiif/2/0b72eabf-58e7-d064-97b3-44508cd248bd/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-nude-cats',
    title: 'Nude with Cats',
    artist: 'Pablo Picasso',
    year: '1901',
    medium: 'Oil on cardboard',
    description:
      'A blue-toned figure curls with two quick cats, tenderness edged by early-modern distortion. The cardboard support lets the paint sit raw, like a sketch caught mid-thought.',
    imageUrl: 'https://www.artic.edu/iiif/2/96c25381-bdfb-81c4-de91-1186aa38ace4/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-sylvette',
    title: 'Portrait of Sylvette David',
    artist: 'Pablo Picasso',
    year: '1954',
    medium: 'Oil on canvas',
    description:
      'Sylvette’s high ponytail and sharp profile become graphic shapes in gray-blue light. Picasso flattens and facets her features until she feels both poster and sculpture.',
    imageUrl: 'https://www.artic.edu/iiif/2/872371ff-d773-f209-8062-7f88c95f2691/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-nude-pitcher',
    title: 'Nude with a Pitcher',
    artist: 'Pablo Picasso',
    year: 'Summer 1906',
    medium: 'Oil on canvas',
    description:
      'Solid, simplified volumes and warm rose tones hint at classical sculpture. The body and pitcher share the same weight, as if both were carved from sunlit clay.',
    imageUrl: 'https://www.artic.edu/iiif/2/aa7ac006-5b63-12aa-3ab7-705cc612aa0a/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-head-woman',
    title: 'Head of a Woman',
    artist: 'Pablo Picasso',
    year: 'Summer 1909',
    medium: 'Oil on canvas',
    description:
      'Planes and edges build a head like an angular stone bust, glowing in ochres and greens. It bridges portrait and architecture, freezing motion into facets.',
    imageUrl: 'https://www.artic.edu/iiif/2/a18f060c-6693-6246-0fe9-abc512841002/full/1200,/0/default.jpg',
  },
  {
    id: 'picasso-nude-pine',
    title: 'Nude under a Pine Tree',
    artist: 'Pablo Picasso',
    year: 'January 20, 1959',
    medium: 'Oil on canvas',
    description:
      'A reclining figure drawn in quick, looping lines rests beneath airy pine branches. Late Picasso lets line stay playful, making the body feel both graphic and alive.',
    imageUrl: 'https://www.artic.edu/iiif/2/b7b7ecd0-5a50-b89a-c72a-d435a1957c73/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-great-wave',
    title: 'Under the Wave off Kanagawa (The Great Wave)',
    artist: 'Katsushika Hokusai',
    year: '1830–33',
    medium: 'Color woodblock print; oban',
    description:
      'A towering wave curls over tiny boats while Mount Fuji watches from the distance, small but immovable. Hokusai captures nature\'s raw power against human fragility in one of art\'s most iconic images.',
    imageUrl: 'https://www.artic.edu/iiif/2/b3974542-b9b4-7568-fc4b-966738f61d78/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-shower-summit',
    title: 'Shower Below the Summit',
    artist: 'Katsushika Hokusai',
    year: '1830–33',
    medium: 'Color woodblock print; oban',
    description:
      'Lightning cracks across Fuji\'s dark slopes as a storm sweeps the mountainside, leaving the snowy peak untouched above. The sacred mountain stands eternal while weather rages around its base.',
    imageUrl: 'https://www.artic.edu/iiif/2/bbb6d024-f931-2e2f-eb95-750991834b1c/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-kohada-koheiji',
    title: 'Kohada Koheiji',
    artist: 'Katsushika Hokusai',
    year: '1831–32',
    medium: 'Color woodblock print; chuban',
    description:
      'A spectral figure peers through a translucent mosquito net, skeletal hands gripping the fabric in eerie stillness. Hokusai turns a ghost story into pure visual dread with minimal means.',
    imageUrl: 'https://www.artic.edu/iiif/2/792d6c6e-1782-dc76-f75a-35e8d1a60357/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-chrysanthemum',
    title: 'Chrysanthemum and Horsefly',
    artist: 'Katsushika Hokusai',
    year: '1831–33',
    medium: 'Color woodblock print; oban',
    description:
      'A single chrysanthemum bloom fills the frame while a tiny horsefly hovers nearby, life meeting life at different scales. Hokusai finds grandeur in a flower and drama in an insect.',
    imageUrl: 'https://www.artic.edu/iiif/2/e81e632c-2e27-d79c-527d-365519796f9f/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-fuji-cherry',
    title: 'Mount Fuji with Cherry Trees in Bloom',
    artist: 'Katsushika Hokusai',
    year: '1801–05',
    medium: 'Color woodblock print; surimono',
    description:
      'Cherry blossoms frame the distant peak of Fuji, pink petals drifting against the mountain\'s quiet blue. Spring\'s fleeting beauty meets the eternal mountain in a meditation on time.',
    imageUrl: 'https://www.artic.edu/iiif/2/0b20c446-9a86-f638-6ad8-9fbd57352146/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-red-fuji',
    title: 'A Mild Breeze on a Fine Day (Red Fuji)',
    artist: 'Katsushika Hokusai',
    year: '1830–33',
    medium: 'Color woodblock print; oban',
    description:
      'Mount Fuji glows red-brown under morning light, its slopes catching the first warmth of dawn. One of Hokusai\'s most iconic images, it distills the sacred mountain to pure color and form.',
    imageUrl: 'https://www.artic.edu/iiif/2/1c3d76ef-338c-10d1-807a-d67fe5b20b16/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-cranes-pine',
    title: 'Cranes on Snow-Covered Pine',
    artist: 'Katsushika Hokusai',
    year: '1834',
    medium: 'Color woodblock print; vertical nagaban',
    description:
      'White cranes perch on snow-laden pine branches, symbols of longevity meeting winter stillness. The vertical composition stretches upward like a scroll of quiet endurance.',
    imageUrl: 'https://www.artic.edu/iiif/2/cc5fce96-3635-35da-e7fd-a68f4b2a26c3/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-hydrangea-swallow',
    title: 'Hydrangea and Swallow',
    artist: 'Katsushika Hokusai',
    year: '1833–34',
    medium: 'Color woodblock print; oban',
    description:
      'A swallow darts past clustered hydrangea blooms, caught mid-flight in summer air. Hokusai freezes motion and stillness together, bird and flower sharing one suspended moment.',
    imageUrl: 'https://www.artic.edu/iiif/2/9bc87079-663c-f320-2da5-29dcd86c68f4/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-mannen-bridge',
    title: 'Beneath Mannen Bridge in Fukagawa',
    artist: 'Katsushika Hokusai',
    year: '1830–33',
    medium: 'Color woodblock print; oban',
    description:
      'Mount Fuji appears through the perfect circle of a bridge arch while a fisherman works below. Geometry frames nature, turning everyday labor into a window onto the eternal.',
    imageUrl: 'https://www.artic.edu/iiif/2/f613b5e8-2d1d-1bca-1406-d850c5f68261/full/1200,/0/default.jpg',
  },
  {
    id: 'hokusai-snowy-morning',
    title: 'Snowy Morning from Koishikawa',
    artist: 'Katsushika Hokusai',
    year: '1830–33',
    medium: 'Color woodblock print; oban',
    description:
      'Fresh snow blankets rooftops and hills while Fuji rises pristine in the distance. Figures trudge through white stillness, their world hushed under winter\'s soft weight.',
    imageUrl: 'https://www.artic.edu/iiif/2/e50f80f4-cc50-6f68-0b4a-4ccb9fd48f31/full/1200,/0/default.jpg',
  },
]
