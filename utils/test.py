#
# Freesound is (c) MUSIC TECHNOLOGY GROUP, UNIVERSITAT POMPEU FABRA
#
# Freesound is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# Freesound is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Authors:
#     See AUTHORS file.
#

import os
from itertools import count

from django.contrib.auth.models import User

from sounds.models import Sound, Pack, License
from utils.tags import clean_and_split_tags


def create_test_files(filenames, directory, n_bytes=1024):
    """
    This function generates test files ith random content and saves them in the specified directory.
    :param filenames: list of names for the files to generate
    :param directory: folder where to store the files
    :param n_bytes: numnber of bytes of each generated file
    """
    for filename in filenames:
        f = open(os.path.join(directory, filename), 'a')
        f.write(os.urandom(n_bytes))
        f.close()


sound_counter = count()  # Used in create_user_and_sounds to avoid repeating sound names


def create_user_and_sounds(num_sounds=1, num_packs=0, user=None, count_offset=0, tags=None,
                           processing_state='PE', moderation_state='PE'):
    """
    Creates User, Sound and Pack objects useful for testing. A 'sound_counter' is used to make sound names unique as
    well as other fields like md5.
    NOTE: creating sounds requires License objects to exist in DB. Do that by making sure your test case loads
    'initial_data' fixture, i.e. "fixtures = ['initial_data']".
    :param num_sounds: N sounds to generate
    :param num_packs: N packs in which the sounds above will be grouped
    :param user: user owner of the created sounds (if not provided, a new user will be created)
    :param count_offset: start counting sounds at X
    :param tags: tags added to the sounds (all sounds will have the same tags)
    :param processing_state: processing state of the created sounds
    :param moderation_state: moderation state of the created sounds
    :return: tuple with (User object, list of Pack objcts, list of Sound objects)
    """
    count_offset = count_offset + next(sound_counter)
    if user is None:
        user = User.objects.create_user("testuser", password="testpass", email='email@freesound.org')
    packs = list()
    for i in range(0, num_packs):
        pack = Pack.objects.create(user=user, name="Test pack %i" % (i + count_offset))
        packs.append(pack)
    sounds = list()
    for i in range(0, num_sounds):
        pack = None
        if packs:
            pack = packs[i % len(packs)]
        sound = Sound.objects.create(user=user,
                                     original_filename="Test sound %i" % (i + count_offset),
                                     base_filename_slug="test_sound_%i" % (i + count_offset),
                                     license=License.objects.all()[0],
                                     pack=pack,
                                     md5="fakemd5_%i" % (i + count_offset),
                                     processing_state=processing_state,
                                     moderation_state=moderation_state)

        if tags is not None:
            sound.set_tags(clean_and_split_tags(tags))
        sounds.append(sound)
    return user, packs, sounds

