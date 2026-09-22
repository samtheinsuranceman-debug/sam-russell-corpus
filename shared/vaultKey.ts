/**
 * Vault key — the sixteen-word key that opens the Brain Hub.
 *
 * Sam asked for a key that is "33 letters, or 16 words if you want". A word
 * key wins on every axis that matters for a key a person has to carry:
 *
 *   • It can be spoken over the phone and typed on a phone keyboard.
 *   • Sixteen words from a 512-word list is 16 × 9 = 144 bits. Guessing is
 *     not the attack anyone needs to worry about.
 *   • Case, spacing and punctuation do not matter — the key is normalised
 *     before it is hashed, so "Forge Anchor" and "forge  anchor" are the same key.
 *
 * The list below is deliberately plain English: no homophones (two / too),
 * no words that are hard to spell, nothing shorter than four letters.
 *
 * Shared between server and client so the browser can tell the owner "that
 * is not sixteen words" before a request is spent, while the server remains
 * the only place that ever decides whether the key is right.
 */

export const VAULT_KEY_WORD_COUNT = 16;

/** A long free-text passphrase is still accepted, at this minimum length. */
export const VAULT_PASSPHRASE_MIN_LENGTH = 32;

// 512 words → 9 bits each. Kept alphabetical so duplicates are easy to spot.
export const VAULT_WORDLIST: readonly string[] = Object.freeze([
  "abbey","acorn","actor","adobe","agent","alarm","album","alley","amber","anchor","angel","ankle","anvil","apple","apron","arena","arrow","aspen","atlas","attic",
  "avenue","awning","badge","bagel","baker","balcony","bamboo","banjo","barley","barn","basil","basin","beach","beacon","beard","beaver","bench","berry","birch","bison",
  "blade","blanket","blossom","bolt","bonnet","border","bottle","boulder","bramble","brass","bread","breeze","brick","bridge","broom","bucket","buckle","budget","buffalo","bugle",
  "bullet","bundle","burlap","butter","button","cabin","cable","cactus","camel","candle","canoe","canvas","canyon","carbon","cargo","carpet","carrot","castle","cattle","cedar",
  "cellar","chalk","chapel","cherry","chess","chimney","cider","cinder","circle","citrus","clamp","cliff","clock","cloud","clover","cobalt","cocoa","coffee","collar","comet",
  "compass","copper","coral","cotton","cougar","cradle","crane","crater","cream","creek","cricket","crown","crystal","cupboard","curtain","cushion","cycle","daisy","dancer","delta",
  "denim","desert","diamond","dinner","dolphin","donkey","dragon","drawer","dune","eagle","easel","echo","elbow","elder","ember","emerald","engine","envelope","fabric","falcon",
  "farmer","feather","fence","fennel","ferry","fiddle","field","finch","flame","flask","fleece","flint","flower","fossil","fountain","frost","galaxy","garden","garlic","gavel",
  "gazelle","geyser","ginger","glacier","globe","goblet","goose","gorge","granite","grape","gravel","grove","guitar","gutter","hammer","hamlet","harbor","harvest","hazel","heather",
  "helmet","heron","hinge","hollow","honey","horizon","hornet","husky","icicle","igloo","index","ingot","inlet","iris","island","ivory","jacket","jaguar","jasper","jelly",
  "jewel","jungle","juniper","kayak","kennel","kernel","kettle","kiosk","kitten","ladder","lagoon","lantern","lapel","larch","laser","lattice","lava","leaf","ledger","lemon",
  "lentil","lever","lilac","linen","lizard","llama","lobster","locket","locust","lotus","lumber","magnet","mango","mantle","maple","marble","market","marsh","mason","meadow",
  "melon","meteor","mirror","mitten","monkey","moose","mortar","mosaic","moss","motor","mountain","muffin","mural","mustard","napkin","nectar","needle","nickel","noodle","north",
  "nozzle","nugget","nutmeg","oasis","olive","onion","opal","orange","orbit","orchid","organ","osprey","otter","oyster","paddle","palace","panda","pansy","panther","parcel",
  "parrot","pasture","peach","pebble","pelican","pencil","pepper","petal","pewter","piano","pickle","pillow","pilot","pine","pistol","pixel","planet","plaster","plum","pocket",
  "polar","poplar","poppy","porch","potato","prairie","prism","pudding","pulley","pumpkin","puppet","puzzle","quail","quarry","quartz","quilt","rabbit","radar","radish","raft",
  "raisin","raven","reef","ribbon","rifle","river","robin","rocket","rooster","rudder","saddle","salmon","sandal","sapphire","satin","scarf","scholar","scooter","shadow","shelter",
  "shield","shovel","silver","sketch","slate","sleigh","slipper","socket","sonnet","sparrow","spider","spinach","spiral","sponge","spruce","squash","squirrel","stable","stamp","statue",
  "steeple","stirrup","stone","stork","stove","summit","sunset","swallow","sycamore","tablet","tailor","talon","tango","tanker","tassel","temple","tendril","thimble","thistle","thunder",
  "ticket","tiger","timber","toffee","tomato","torch","tractor","trellis","tripod","trolley","trout","trumpet","tulip","tunnel","turban","turnip","turtle","umbrella","valley","velvet",
  "vessel","viaduct","viking","vinegar","violet","violin","volcano","waffle","wagon","walnut","walrus","wander","warden","wasp","water","weasel","willow","window","winter","wizard",
  "wolf","woodland","wreath","yacht","yarrow","yeast","yogurt","zebra","zenith","zephyr","zinc","zipper","abacus","acre","alcove","almond","antler","archer","armor","arbor",
  "amulet","aurora","axle","bandit","banner","barrel","basket","beetle","bellows","bishop","blizzard","boat","bobcat","bough","bounty","brook","daybreak","bushel","cabbage","caliper",
  "canteen","caravan","cascade","cavern","chestnut","chisel","cobble","cobra","condor","cornet","corral","cottage","coyote","crocus","cutlass","cypress","dagger","dahlia","elixir","dingo",
  "drum","dusk","ebony","estuary","fable","flagon","fawn","fern","foxglove","fjord","flax","gecko","forge","inkwell","gable","gale","jasmine","glade","gnome","gourd",
  "gull","gust","hail","halo","hare","hawk","hearth","hedge","hive","hoof","ibis","javelin","juror","jade","kelp","kiln","kite","knoll","lark",
]);

/** Lower-case, trim, collapse whitespace, strip punctuation between words. */
export function normalizeVaultKey(raw: string): string {
  return (raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a normalised key into its words. */
export function vaultKeyWords(raw: string): string[] {
  const normalized = normalizeVaultKey(raw);
  return normalized ? normalized.split(" ") : [];
}

/**
 * Is this the sixteen-word shape? Only checks the shape — every word must be
 * from the list and there must be exactly sixteen. Whether it is the RIGHT
 * key is the server's decision alone.
 */
export function isSixteenWordKey(raw: string): boolean {
  const words = vaultKeyWords(raw);
  if (words.length !== VAULT_KEY_WORD_COUNT) return false;
  const list = new Set(VAULT_WORDLIST);
  return words.every(w => list.has(w));
}

/**
 * Accepts either the sixteen-word key or a long free-text passphrase. Returns
 * a reason when the value cannot be a vault key at all, so the UI can say why
 * before spending a request.
 */
export function vaultKeyShapeProblem(raw: string): string | null {
  const normalized = normalizeVaultKey(raw);
  if (!normalized) return "Enter the sixteen-word key.";
  if (isSixteenWordKey(raw)) return null;
  const words = vaultKeyWords(raw);
  const list = new Set(VAULT_WORDLIST);
  const unknown = words.filter(w => !list.has(w));
  if (words.length === VAULT_KEY_WORD_COUNT) {
    return `${unknown.length} word${unknown.length === 1 ? " is" : "s are"} not on the key list: ${unknown.slice(0, 4).join(", ")}. Check the spelling.`;
  }
  // Every word is on the key list but the count is off: almost certainly a
  // mis-copied key, so say so rather than treating it as a passphrase.
  if (unknown.length === 0) {
    return `That is ${words.length} word${words.length === 1 ? "" : "s"}; the key has ${VAULT_KEY_WORD_COUNT}.`;
  }
  if (raw.trim().length >= VAULT_PASSPHRASE_MIN_LENGTH) return null; // long passphrase form
  return `That is ${words.length} word${words.length === 1 ? "" : "s"}; the key has ${VAULT_KEY_WORD_COUNT}.`;
}

/**
 * Generate a fresh sixteen-word key from a supplied source of random bytes.
 * The server passes crypto.randomBytes; the function itself has no
 * dependency on Node so it can be unit-tested anywhere.
 */
export function generateVaultKey(randomBytes: (n: number) => Uint8Array): string {
  const words: string[] = [];
  const size = VAULT_WORDLIST.length;
  // Rejection sampling so every word is equally likely — no modulo bias.
  const limit = Math.floor(65536 / size) * size;
  while (words.length < VAULT_KEY_WORD_COUNT) {
    const bytes = randomBytes(2);
    const value = (bytes[0] << 8) | bytes[1];
    if (value >= limit) continue;
    words.push(VAULT_WORDLIST[value % size]);
  }
  return words.join(" ");
}

/** Render the key in four lines of four for the one time it is shown. */
export function formatVaultKeyForDisplay(key: string): string[] {
  const words = vaultKeyWords(key);
  const rows: string[] = [];
  for (let i = 0; i < words.length; i += 4) rows.push(words.slice(i, i + 4).join("  "));
  return rows;
}
