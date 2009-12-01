Concert Hall Impulse Responses - Pori, Finland
----------------------------------------------

The impulse response database described in this document is available
for download from http://www.acoustics.hut.fi/projects/poririrs/.

Contents of the document:
1. Introduction
2. Microphone and channel specifications
3. List of files
4. References
5. Copyright


1. Introduction
---------------

The responses included in the database were measured in the
Promenadikeskus concert hall located in Pori, Finland. The responses
are provided as 24-bit wav files including 2-5 channels depending on
the type of the response. Each wav file includes the combined response
to an omnidirectional dodecahedron loudspeaker and a subwoofer. The
responses have been measured with 3 source positions on the stage
(S1-S3), 4 receiver positions in the audience area (R1-R4), and 3
receiver positions on the stage (P1-P3). All provided responses are
system compensated and denoised.



2. Microphone and channel specifications
----------------------------------------

Microphone directions are specified in a Cartesian coordinate
system. The positive X direction (front) for each receiver position in
the audience area is defined as the direction towards the stage
perpendicular to the backs of the seats in the corresponding
position. For the receiver positions on the stage, the front is
defined as the direction perpendicular to and pointing towards the
front wall behind the stage. Positive Y and Z directions are defined
as left and up, respectively, when facing the front.

The utilized microphones and channels are defined as follows:

DPA 4006
  Pair of DPA Type 4006 omnidirectional microphones facing the front
  with a distance of 10 cm between them in the left-right direction.
  L = leftmost microphone, R = rightmost microphone.

HATS
  Brüel and Kjær HATS dummy head custom fitted with DPA Type 4053
  microphones, facing the front. L = left ear input, R = right ear
  input.

HATS, d.f. EQ
  Same as HATS, but diffuse field equalized [1].

Pearl
  Pearl TL-4 stereo condenser microphone with cardioid directivity
  patterns. L = cardioid facing left, R = cardioid facing right.

SIRR
  SoundField B-format signals processed with the SIRR method [1] for
  reproduction with a standard 5.0 loudspeaker setup. Loudspeakers for
  the corresponding channels should be located in the horizontal plane
  equidistant from a listener with the following azimuthal angles:
  left (L): 30, right (R): -30, center (C): 0, left surround (LS):
  110, and right surround (RS): -110.

SoundField
  B-format signals from a SoundField MKV microphone system. W is an
  omnidirectional signal and X, Y, and Z have figure-of-eight
  directivity patterns with positive directions aligned with the
  corresponding positive coordinate axes.



3. List of files
----------------

The measurements with different microphones have been packed into
individual zip files. Furthermore, measurements with receivers on the
stage are available in separate packages. The full database includes
the following response packages:

File	      Contents       Channels      Src  Rcv  Microphone
----          --------       --------      ---  ---  ----------
binaural.zip  s1_r1_b.wav    L,R           S1   R1   HATS
              s1_r2_b.wav    L,R           S1   R2   HATS
              s1_r3_b.wav    L,R           S1   R3   HATS
              s1_r4_b.wav    L,R           S1   R4   HATS
              s2_r1_b.wav    L,R           S2   R1   HATS
              s2_r2_b.wav    L,R           S2   R2   HATS
              s2_r3_b.wav    L,R           S2   R3   HATS
              s2_r4_b.wav    L,R           S2   R4   HATS
              s3_r1_b.wav    L,R           S3   R1   HATS
              s3_r2_b.wav    L,R           S3   R2   HATS
              s3_r3_b.wav    L,R           S3   R3   HATS
              s3_r4_b.wav    L,R           S3   R4   HATS

bin_dfeq.zip  s1_r1_bd.wav   L,R           S1   R1   HATS, d.f. EQ
              s1_r2_bd.wav   L,R           S1   R2   HATS, d.f. EQ
              s1_r3_bd.wav   L,R           S1   R3   HATS, d.f. EQ
              s1_r4_bd.wav   L,R           S1   R4   HATS, d.f. EQ
              s2_r1_bd.wav   L,R           S2   R1   HATS, d.f. EQ
              s2_r2_bd.wav   L,R           S2   R2   HATS, d.f. EQ
              s2_r3_bd.wav   L,R           S2   R3   HATS, d.f. EQ
              s2_r4_bd.wav   L,R           S2   R4   HATS, d.f. EQ
              s3_r1_bd.wav   L,R           S3   R1   HATS, d.f. EQ
              s3_r2_bd.wav   L,R           S3   R2   HATS, d.f. EQ
              s3_r3_bd.wav   L,R           S3   R3   HATS, d.f. EQ
              s3_r4_bd.wav   L,R           S3   R4   HATS, d.f. EQ

cardioid.zip  s1_r1_c.wav    L,R           S1   R1   Pearl
              s1_r2_c.wav    L,R           S1   R2   Pearl
              s1_r3_c.wav    L,R           S1   R3   Pearl
              s1_r4_c.wav    L,R           S1   R4   Pearl
              s2_r1_c.wav    L,R           S2   R1   Pearl
              s2_r2_c.wav    L,R           S2   R2   Pearl
              s2_r3_c.wav    L,R           S2   R3   Pearl
              s2_r4_c.wav    L,R           S2   R4   Pearl
              s3_r1_c.wav    L,R           S3   R1   Pearl
              s3_r2_c.wav    L,R           S3   R2   Pearl
              s3_r3_c.wav    L,R           S3   R3   Pearl
              s3_r4_c.wav    L,R           S3   R4   Pearl

omni.zip      s1_r1_o.wav    L,R           S1   R1   DPA 4006
              s1_r2_o.wav    L,R           S1   R2   DPA 4006
              s1_r3_o.wav    L,R           S1   R3   DPA 4006
              s1_r4_o.wav    L,R           S1   R4   DPA 4006
              s2_r1_o.wav    L,R           S2   R1   DPA 4006
              s2_r2_o.wav    L,R           S2   R2   DPA 4006
              s2_r3_o.wav    L,R           S2   R3   DPA 4006
              s2_r4_o.wav    L,R           S2   R4   DPA 4006
              s3_r1_o.wav    L,R           S3   R1   DPA 4006
              s3_r2_o.wav    L,R           S3   R2   DPA 4006
              s3_r3_o.wav    L,R           S3   R3   DPA 4006
              s3_r4_o.wav    L,R           S3   R4   DPA 4006

omni_p.zip    s1_p1_o.wav    L,R           S1   P1   DPA 4006
              s1_p2_o.wav    L,R           S1   P2   DPA 4006
              s1_p3_o.wav    L,R           S1   P3   DPA 4006
              s2_p1_o.wav    L,R           S2   P1   DPA 4006
              s2_p2_o.wav    L,R           S2   P2   DPA 4006
              s2_p3_o.wav    L,R           S2   P3   DPA 4006
              s3_p1_o.wav    L,R           S3   P1   DPA 4006
              s3_p2_o.wav    L,R           S3   P2   DPA 4006
              s3_p3_o.wav    L,R           S3   P3   DPA 4006

sirr.zip      s1_r1_sr.wav   L,R,C,LS,RS   S1   R1   SIRR
              s1_r2_sr.wav   L,R,C,LS,RS   S1   R2   SIRR
              s1_r3_sr.wav   L,R,C,LS,RS   S1   R3   SIRR
              s1_r4_sr.wav   L,R,C,LS,RS   S1   R4   SIRR
              s2_r1_sr.wav   L,R,C,LS,RS   S2   R1   SIRR
              s2_r2_sr.wav   L,R,C,LS,RS   S2   R2   SIRR
              s2_r3_sr.wav   L,R,C,LS,RS   S2   R3   SIRR
              s2_r4_sr.wav   L,R,C,LS,RS   S2   R4   SIRR
              s3_r1_sr.wav   L,R,C,LS,RS   S3   R1   SIRR
              s3_r2_sr.wav   L,R,C,LS,RS   S3   R2   SIRR
              s3_r3_sr.wav   L,R,C,LS,RS   S3   R3   SIRR
              s3_r4_sr.wav   L,R,C,LS,RS   S3   R4   SIRR

sndfld.zip    s1_r1_sf.wav   W,X,Y,Z       S1   R1   SoundField
              s1_r2_sf.wav   W,X,Y,Z       S1   R2   SoundField
              s1_r3_sf.wav   W,X,Y,Z       S1   R3   SoundField
              s1_r4_sf.wav   W,X,Y,Z       S1   R4   SoundField
              s2_r1_sf.wav   W,X,Y,Z       S2   R1   SoundField
              s2_r2_sf.wav   W,X,Y,Z       S2   R2   SoundField
              s2_r3_sf.wav   W,X,Y,Z       S2   R3   SoundField
              s2_r4_sf.wav   W,X,Y,Z       S2   R4   SoundField
              s3_r1_sf.wav   W,X,Y,Z       S3   R1   SoundField
              s3_r2_sf.wav   W,X,Y,Z       S3   R2   SoundField
              s3_r3_sf.wav   W,X,Y,Z       S3   R3   SoundField
              s3_r4_sf.wav   W,X,Y,Z       S3   R4   SoundField

sndfld_p.zip  s1_r1_sf.wav   W,X,Y,Z       S1   P1   SoundField
              s1_r2_sf.wav   W,X,Y,Z       S1   P2   SoundField
              s1_r3_sf.wav   W,X,Y,Z       S1   P3   SoundField
              s2_r1_sf.wav   W,X,Y,Z       S2   P1   SoundField
              s2_r2_sf.wav   W,X,Y,Z       S2   P2   SoundField
              s2_r3_sf.wav   W,X,Y,Z       S2   P3   SoundField
              s3_r1_sf.wav   W,X,Y,Z       S3   P1   SoundField
              s3_r2_sf.wav   W,X,Y,Z       S3   P2   SoundField
              s3_r3_sf.wav   W,X,Y,Z       S3   P3   SoundField



4. References
-------------

[1] J. Merimaa, T. Peltonen, and T. Lokki, 2005: "Concert hall impulse
responses - Pori, Finland: Reference." Available at
http://www.acoustics.hut.fi/projects/poririrs/.

[2] J. Merimaa, T. Peltonen, and T. Lokki, 2005: "Concert hall impulse
responses - Pori, Finland: Analysis results." Available at
http://www.acoustics.hut.fi/projects/poririrs/.



5. Copyright
------------

SIRR processed data are Copyright (C)2005 by Helsinki University of
Technology (TKK). All other data are Copyright (C)2005 by TKK, Akukon
Oy Consulting Engineers, and the authors. The data are provided free
for noncommercial purposes, provided the authors are cited when the
data are used in any research application. Commercial use is
prohibited and allowed only by written permission of the copyright
owners.
